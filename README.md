# CRM Backend System

A robust and scalable Customer Relationship Management (CRM) backend system built with TypeScript, Express.js, and MySQL.

## 🚀 Features

- **Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control
  - Security groups and rules management

- **Customer Management**
  - Customer profiles
  - Customer types categorization
  - Billing address management

- **Campaign Management**
  - Campaign forms
  - Audience targeting
  - Campaign status tracking
  - Campaign types

- **Lead Management**
  - Lead tracking
  - Lead source management
  - Lead status workflow
  - Contact management

- **Task Management**
  - Task boards
  - Task assignment
  - Status tracking
  - Sequential ordering

- **Financial Features**
  - Currency management
  - Tax rate configuration
  - Payment medium handling
  - Expense categories

- **System Features**
  - Email template management
  - Event calendar
  - Audit logging
  - Menu management

## 🛠️ Technical Stack

- **Backend Framework**: Express.js with TypeScript
- **Database**: MySQL with connection pooling
- **Authentication**: JWT (JSON Web Tokens)
- **Logging**: Winston with MySQL transport
- **Email**: Nodemailer with Handlebars templating
- **API Documentation**: RESTful architecture

## 🏗️ Architecture

- **Controller-based structure**
- **Middleware implementation**
  - Audit logging
  - Authentication verification
  - Request validation
  - Error handling

- **Database**
  - Connection pooling
  - Transaction management
  - Query builders
  - Prepared statements

## 🔒 Security Features

- Token-based authentication
- Request validation
- SQL injection prevention
- Audit trails
- Role-based access control

## 📝 API Documentation

The API follows RESTful conventions with the following main endpoints:

- `/auth` - Authentication endpoints
- `/campaigns` - Campaign management
- `/customers` - Customer operations
- `/leads` - Lead management
- `/tasks` - Task management
- `/security` - Security settings

## 🚀 Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   ```env
   DB_HOST=your_db_host
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_NAME=your_db_name
   JWT_SECRET=your_jwt_secret
   ```
4. Run the application:
   ```bash
   npm start
   ```

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📄 License

[Add your license here]
