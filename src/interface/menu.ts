export interface Menu {
  id: number;
  title: String;
  url: String;
  icon: String;
  icon_library: String;
  parent_id: String;
  sequence_no: String;
  is_active: String;

  can_view: boolean;
  can_create: boolean;
  can_update: boolean;
  can_delete: boolean;
  can_report: boolean;
}
