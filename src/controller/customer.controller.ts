import { Request, Response } from "express";
import {
  Customer,
  CustomerBillingAddress,
  CustomerShippingAddress,
} from "../interface/customer";
import { connection } from "../config/mysql.config";
import { QUERY } from "../query/customer-query";
import { Code } from "../enum/code.enum";
import { HttpResponse } from "../domain/response";
import { Status } from "../enum/status.enum";
import { FieldPacket, ResultSetHeader, RowDataPacket, OkPacket } from "mysql2";

import { generateInsertQuery } from "../query-maker/insert-query-maker";
import { generateUpdateQuery } from "../query-maker/update-query-maker";
import AuditLogger from "../middleware/audit-log";
const { v4: uuidv4 } = require("uuid");

type ResultSet = [
  RowDataPacket[] | RowDataPacket[][] | OkPacket | OkPacket[] | ResultSetHeader,
  FieldPacket[]
];

export const getDataWithPagination = async (
  req: Request,
  res: Response
): Promise<Response<Customer>> => {
  console.info(
    `[${new Date().toLocaleString()}] Incoming ${req.method}${
      req.originalUrl
    } Request from ${(req.rawHeaders[0], req.rawHeaders[1])}`
  );
  let { tableName = "", page = 0, pageSize = 0 } = { ...req.body };

  try {
    const pool = await connection();

    const countResult: ResultSet = await pool.query(QUERY.GET_TOTAL_COUNT, [
      tableName,
    ]);

    const result: ResultSet = await pool.query(
      `SELECT c.* FROM 
      customers c 
      order by c.created_at desc LIMIT ? OFFSET ? `,
      [pageSize, (parseInt(page) - 1) * parseInt(pageSize)]
    );
    const rows = (result[0] as Array<ResultSet>).length > 0 ? result[0] : [];
    // console.log(rows);

    const total = (countResult[0] as RowDataPacket[])[0];

    const data = {
      total,
      rows,
    };

    return res
      .status(Code.CREATED)
      .send(
        new HttpResponse(Code.CREATED, Status.CREATED, "Data Fetched", data)
      );
  } catch (error: unknown) {
    console.log(error);
    return res
      .status(Code.INTERNAL_SERVER_ERROR)
      .send(
        new HttpResponse(
          Code.INTERNAL_SERVER_ERROR,
          Status.INTERNAL_SERVER_ERROR,
          "An error occured!!!"
        )
      );
  }
};

export const getCustomers = async (
  req: Request,
  res: Response
): Promise<Response<Customer[]>> => {
  console.info(
    `[${new Date().toLocaleString()}] Incoming ${req.method}${
      req.originalUrl
    } Request from ${(req.rawHeaders[0], req.rawHeaders[1])}`
  );
  try {
    const pool = await connection();
    const result: ResultSet = await pool.query(QUERY.SELECT_CUSTOMERS);

    return res
      .status(Code.OK)
      .send(
        new HttpResponse(Code.OK, Status.OK, "Customers retrived", result[0])
      );
  } catch (error: unknown) {
    console.log(error);
    return res
      .status(Code.INTERNAL_SERVER_ERROR)
      .send(
        new HttpResponse(
          Code.INTERNAL_SERVER_ERROR,
          Status.INTERNAL_SERVER_ERROR,
          "An error occured!!!"
        )
      );
  }
};

export const getCustomer = async (
  req: Request,
  res: Response
): Promise<Response<Customer>> => {
  console.info(
    `[${new Date().toLocaleString()}] Incoming ${req.method}${
      req.originalUrl
    } Request from ${(req.rawHeaders[0], req.rawHeaders[1])}`
  );
  try {
    const pool = await connection();
    const result: ResultSet = await pool.query(QUERY.SELECT_CUSTOMER, [
      req.params.customerId,
    ]);

    if ((result[0] as Array<ResultSet>).length > 0) {
      const customer = (result[0] as RowDataPacket[])[0];
      const resultShipping: ResultSet = await pool.query(
        QUERY.SELECT_CUSTOMER_SHIPPING_ADDRESS_BY_CUSTOMER,
        [req.params.customerId]
      );
      const resultBilling: ResultSet = await pool.query(
        QUERY.SELECT_CUSTOMER_BILLING_ADDRESS_BY_CUSTOMER,
        [req.params.customerId]
      );

      const billing = (
        resultBilling[0] as RowDataPacket[]
      )[0] as CustomerBillingAddress;
      const shipping = (
        resultShipping[0] as RowDataPacket[]
      )[0] as CustomerShippingAddress;

      return res.status(Code.OK).send(
        new HttpResponse(Code.OK, Status.OK, "Customer Rtrived", {
          ...customer,
          billing,
          shipping,
        })
      );
    } else {
      return res
        .status(Code.NOT_FOUND)
        .send(
          new HttpResponse(
            Code.NOT_FOUND,
            Status.NOT_FOUND,
            "Customer Not Found"
          )
        );
    }
  } catch (error: unknown) {
    console.log(error);
    return res
      .status(Code.INTERNAL_SERVER_ERROR)
      .send(
        new HttpResponse(
          Code.INTERNAL_SERVER_ERROR,
          Status.INTERNAL_SERVER_ERROR,
          "An error occured!!!"
        )
      );
  }
};

export const createCustomer = async (
  req: Request,
  res: Response
): Promise<Response<Customer>> => {
  console.info(
    `[${new Date().toLocaleString()}] Incoming ${req.method}${
      req.originalUrl
    } Request from ${(req.rawHeaders[0], req.rawHeaders[1])}`
  );
  let customer: Customer = { ...req.body };
  let billing: CustomerBillingAddress = { ...req.body.billing };
  let shipping: CustomerShippingAddress = { ...req.body.shipping };

  const pool = await connection();
  const auditLogger = new AuditLogger(pool);

  const conn = await pool.getConnection();
  await conn.beginTransaction();

  try {
    const loggedUser = (req as any).user;
    const customerId = uuidv4();
    const customerModel = {
      id: customerId,
      company_name: customer.company_name,
      company_website: customer.company_website,
      vat_number: customer.vat_number,
      phone: customer.phone,
      address: customer.address,
      email: customer.email,
      currency: customer.currency,
      customer_type: customer.customer_type,
      city: customer.city,
      zipcode: customer.zipcode,
      country: customer.country,
      is_active: customer.is_active || false,

      created_at: new Date(),
      created_by: loggedUser.id,
      created_ip: req.ip,
      updated_at: null,
      updated_by: null,
      updated_ip: null,
      company_id: loggedUser.company_id,
    };

    const result: ResultSet = await pool.query(
      generateInsertQuery(customerModel, "customers"),
      [...Object.values(customerModel)]
    );

    const billingId = uuidv4();
    const billingModel = {
      id: billingId,
      customer_id: customerId,
      address: billing.address,
      city: billing.city,
      zipcode: billing.zipcode,
      country: billing.country,

      created_at: new Date(),
      created_by: loggedUser.id,
      created_ip: req.ip,
      updated_at: null,
      updated_by: null,
      updated_ip: null,
      company_id: loggedUser.company_id,
    };

    const resultBilling: ResultSet = await pool.query(
      generateInsertQuery(billingModel, "customer_billing_address"),
      [...Object.values(billingModel)]
    );

    await auditLogger.logAction(
      "customer_billing_address",
      billingId,
      "insert",
      {},
      billingModel
    );

    const shippingId = uuidv4();
    const shippingModel = {
      id: shippingId,
      customer_id: customerId,
      address: shipping.address,
      city: shipping.city,
      zipcode: shipping.zipcode,
      country: shipping.country,

      created_at: new Date(),
      created_by: loggedUser.id,
      created_ip: req.ip,
      updated_at: null,
      updated_by: null,
      updated_ip: null,
      company_id: loggedUser.company_id,
    };

    const resultShipping: ResultSet = await pool.query(
      generateInsertQuery(shippingModel, "customer_shipping_address"),
      [...Object.values(shippingModel)]
    );

    await auditLogger.logAction(
      "customer_shipping_address",
      shippingId,
      "insert",
      {},
      shippingModel
    );

    await auditLogger.logAction(
      "customers",
      customerId,
      "insert",
      {},
      customerModel
    );

    await conn.commit();
    conn.release();

    return res
      .status(Code.CREATED)
      .send(
        new HttpResponse(
          Code.CREATED,
          Status.CREATED,
          "Customer Created",
          customer
        )
      );
  } catch (error) {
    console.log(error);
    if (conn) {
      console.log("Attempting rollback...");
      await conn.rollback();
      console.log("Rollback completed.");
      await conn.release();
    }

    return res
      .status(Code.INTERNAL_SERVER_ERROR)
      .send(
        new HttpResponse(
          Code.INTERNAL_SERVER_ERROR,
          Status.INTERNAL_SERVER_ERROR,
          "An error occurred!!!"
        )
      );
  }
};

export const updateCustomer = async (
  req: Request,
  res: Response
): Promise<Response<Customer>> => {
  console.info(
    `[${new Date().toLocaleString()}] Incoming ${req.method}${
      req.originalUrl
    } Request from ${(req.rawHeaders[0], req.rawHeaders[1])}`
  );
  let customer: Customer = { ...req.body };
  let billing: CustomerBillingAddress = { ...req.body.billing };
  let shipping: CustomerShippingAddress = { ...req.body.shipping };

  const pool = await connection();
  const auditLogger = new AuditLogger(pool);

  const conn = await pool.getConnection();
  await conn.beginTransaction();
  try {
    const loggedUser = (req as any).user;
    const result: ResultSet = await pool.query(QUERY.SELECT_CUSTOMER, [
      req.params.customerId,
    ]);

    const customerModel = {
      company_name: customer.company_name,
      company_website: customer.company_website,
      vat_number: customer.vat_number,
      phone: customer.phone,
      address: customer.address,
      email: customer.email,
      currency: customer.currency,
      customer_type: customer.customer_type,
      city: customer.city,
      zipcode: customer.zipcode,
      country: customer.country,
      is_active: customer.is_active || false,

      updated_by: loggedUser.id,
      updated_at: new Date(),
      updated_ip: req.ip,
      company_id: loggedUser.company_id,
    };

    if ((result[0] as Array<ResultSet>).length > 0) {
      const updateCustomer: ResultSet = await pool.query(
        generateUpdateQuery(customerModel, "customers", "id"),
        [...Object.values(customerModel), req.params.customerId]
      );

      //update billing address
      const resultBill: ResultSet = await pool.query(
        QUERY.SELECT_CUSTOMER_BILLING_ADDRESS_BY_CUSTOMER,
        [req.params.customerId]
      );

      const billingModel = {
        address: billing.address,
        city: billing.city,
        zipcode: billing.zipcode,
        country: billing.country,

        updated_by: loggedUser.id,
        updated_at: new Date(),
        updated_ip: req.ip,
        company_id: loggedUser.company_id,
      };
      if ((resultBill[0] as Array<ResultSet>).length > 0) {
        const updateCustomerBillingAddress: ResultSet = await pool.query(
          generateUpdateQuery(
            billingModel,
            "customer_billing_address",
            "customer_id"
          ),
          [...Object.values(billingModel), req.params.customerId]
        );

        await auditLogger.logAction(
          "customer_billing_address",
          req.params.customerId,
          "update",
          resultBill[0],
          billingModel
        );
      }

      //update shippping address
      const resultShipping: ResultSet = await pool.query(
        QUERY.SELECT_CUSTOMER_SHIPPING_ADDRESS_BY_CUSTOMER,
        [req.params.customerId]
      );

      const shippingModel = {
        address: shipping.address,
        city: shipping.city,
        zipcode: shipping.zipcode,
        country: shipping.country,

        updated_by: loggedUser.id,
        updated_at: new Date(),
        updated_ip: req.ip,
        company_id: loggedUser.company_id,
      };
      if ((resultShipping[0] as Array<ResultSet>).length > 0) {
        const updateCustomerShippingAddress: ResultSet = await pool.query(
          generateUpdateQuery(
            shippingModel,
            "customer_shipping_address",
            "customer_id"
          ),
          [...Object.values(shippingModel), req.params.customerId]
        );

        await auditLogger.logAction(
          "customer_shipping_address",
          req.params.customerId,
          "update",
          resultShipping[0],
          shippingModel
        );
      }

      await auditLogger.logAction(
        "customers",
        req.params.customerId,
        "update",
        result[0],
        customerModel
      );

      await conn.commit();
      conn.release();

      return res.status(Code.OK).send(
        new HttpResponse(Code.OK, Status.OK, "Customer Updated", {
          ...customer,
          id: req.params.customerId,
        })
      );
    } else {
      return res
        .status(Code.NOT_FOUND)
        .send(
          new HttpResponse(
            Code.NOT_FOUND,
            Status.NOT_FOUND,
            "Customer Not Found"
          )
        );
    }
  } catch (error: unknown) {
    console.log(error);
    if (conn) {
      console.log("Attempting rollback...");
      await conn.rollback();
      console.log("Rollback completed.");
    }
    return res
      .status(Code.INTERNAL_SERVER_ERROR)
      .send(
        new HttpResponse(
          Code.INTERNAL_SERVER_ERROR,
          Status.INTERNAL_SERVER_ERROR,
          "An error occured!!!"
        )
      );
  } finally {
    await conn!.commit();
    await conn!.release();
  }
};

export const deleteCustomer = async (
  req: Request,
  res: Response
): Promise<Response<Customer>> => {
  console.info(
    `[${new Date().toLocaleString()}] Incoming ${req.method}${
      req.originalUrl
    } Request from ${(req.rawHeaders[0], req.rawHeaders[1])}`
  );
  try {
    const pool = await connection();
    const auditLogger = new AuditLogger(pool);
    const result: ResultSet = await pool.query(QUERY.SELECT_CUSTOMER, [
      req.params.customerId,
    ]);

    if ((result[0] as Array<ResultSet>).length > 0) {
      const updateCustomer: ResultSet = await pool.query(
        QUERY.DELETE_CUSTOMER,
        [[req.params.customerId]]
      );
      await auditLogger.logAction(
        "customers",
        req.params.customerId,
        "delete",
        (result[0] as Array<ResultSet>).length > 0 ? result[0] : [],
        {}
      );
      return res
        .status(Code.OK)
        .send(new HttpResponse(Code.OK, Status.OK, "Customer Deleted!"));
    } else {
      return res
        .status(Code.NOT_FOUND)
        .send(
          new HttpResponse(
            Code.NOT_FOUND,
            Status.NOT_FOUND,
            "Customer Not Found"
          )
        );
    }
  } catch (error: unknown) {
    console.log(error);
    return res
      .status(Code.INTERNAL_SERVER_ERROR)
      .send(
        new HttpResponse(
          Code.INTERNAL_SERVER_ERROR,
          Status.INTERNAL_SERVER_ERROR,
          "An error occured!!!"
        )
      );
  }
};
