export const PERM_LOG_EXCHANGE = "perm_log_exchange";
//-----------------------ENUMS------------------------//

export enum QueueNameEnum {
  /**
   * For testing purposes only
   */
  Test = "test_queue",
  Perm = "perm_queue",
  Log = "log_queue",
}

export enum LogLevelEnum {
  /**
   * when an action cannot be completed or anything critical
   */
  "Error" = "Error",
  /**
   * issue that doesn't cause an immediate to the execution/completion of an action
   */
  "Warn" = "Warn",
  /**
   * anything worth noting
   */
  "Info" = "Info",
  /**
   * request and response information
   */
  "Http" = "Http",
}

// TODO: class definitions for event enums
export enum PermLogEventsEnum {
  /**
   * all Perm events
   */
  "Perm*" = "Perm.*",
  /**
   * user request perm calculation
   */
  "PermRequested" = "Perm.Requested",
  /**
   * perm has been calculated and saved in mongodb
   */
  "PermCalculated" = "Perm.Calculated",
  /**
   * user fecth perm(s)
   */
  "PermFetched" = "Perm.Fetched",
  /**
   * perm wants to log event explicitly
   */
  "PermExplicitLog" = "Perm.ExplicitLog",
  /**
   * all events related to rabbit itself
   */
  "Rabbit*" = "Rabbit.*",
  /**
   * when an empty message/content is received by a subscriber
   */
  "RabbitEmptyMessage" = "Rabbit.EmptyMessage",
}

//-----------------------CLASSES------------------------//

export class RabbitEmptyMessage {
  queueName!: string;

  constructor(dto?: RabbitEmptyMessage) {
    if (dto) Object.assign(this, dto);
  }
}

//-----------------------FUNCTIONS------------------------//

/**
 * Always return the string version of an object. Returns empty string for falsy
 * @param data Item to stringify
 * @returns string
 */
export function stringifyIfNot(data: any) {
  if (data == undefined) return "";
  return typeof data === "string" ? data : JSON.stringify(data);
}
