import { Expose } from "class-transformer";
import { PermLogErrorCodeEnum } from "./error";
import { v4 as uuidv4 } from "uuid";
import { NextFunction, Request, Response } from "express";
import { getClientIp } from "request-ip";
import iplocation from "iplocation";
import DeviceDetector from "device-detector-js";
import { Types } from "mongoose";

export const PERM_LOG_EXCHANGE = "perm_log_exchange";
export const X_REQUEST_ID = "x-request-id";

//-----------------------Types------------------------//

export type ResponseNameType = ResponeNameEnum | PermLogErrorCodeEnum;

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

/**
 * Used specifically in response to requests
 */
export enum ResponeNameEnum {
  SUCCESS = "SUCCESS",
  NOT_FOUND = "NOT_FOUND",
}

export enum PermLogEventsEnum {
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
   * when an empty message/content is received by a subscriber
   */
  "RabbitEmptyMessage" = "Rabbit.EmptyMessage",
}

//-----------------------CLASSES------------------------//

export class PermSchemaDto {
  @Expose()
  _id!: Types.ObjectId;

  @Expose()
  permNumber!: number;

  @Expose()
  calculatedFactorial!: number;

  @Expose()
  appliedDelay!: number;

  @Expose()
  updatedAt!: Date;

  @Expose()
  createdAt!: Date;

  @Expose()
  __v!: number;
}

export class PermRequested {
  @Expose()
  reqContext!: RequestContextDto;

  @Expose()
  permNumber!: number;

  @Expose()
  delay?: number;

  constructor(dto?: PermRequested) {
    if (dto) Object.assign(this, dto);
  }
}

export class PermCalculated extends PermSchemaDto {
  constructor(dto?: PermCalculated) {
    super();
    if (dto) Object.assign(this, dto);
  }
}

export class RabbitEmptyMessage {
  @Expose()
  queueName!: string;

  constructor(dto?: RabbitEmptyMessage) {
    if (dto) Object.assign(this, dto);
  }
}

export class ResponseDto {
  /**
   * response error code
   */
  @Expose()
  name!: ResponseNameType;
  /**
   * message that can be shown to users
   */
  @Expose()
  message!: string;
  /**
   * any other information that can help with the error
   */
  @Expose()
  data?: any;

  constructor(dto?: ResponseDto) {
    if (dto) Object.assign(this, dto);
  }
}

export class DeviceDto {
  /**
   * Name of the device
   */
  @Expose()
  name!: string;

  /**
   * Is device (or object) a bot
   */
  @Expose()
  isBot!: boolean;

  constructor(dto?: DeviceDto) {
    if (dto) Object.assign(this, dto);
  }
}

export class RequestContextDto {
  @Expose()
  requestId!: string;

  @Expose()
  url!: string;

  @Expose()
  requestMethod!: string;

  @Expose()
  ipAddress!: string;

  @Expose()
  device!: DeviceDto;

  @Expose()
  location?: iplocation.ReturnType;

  @Expose()
  time!: Date;

  constructor(dto?: RequestContextDto) {
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

/**
 * Assigns request id to request and response object,
 * Also assigns req context to req.context object
 */
export async function ReqContextMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const reqId = uuidv4();

  req.headers[X_REQUEST_ID] = reqId;
  res.set(X_REQUEST_ID, reqId);

  const reqContext = new RequestContextDto();
  reqContext.url = req.url;
  reqContext.time = new Date();
  reqContext.requestMethod = req.method;
  reqContext.requestId = reqId;
  reqContext.ipAddress = getClientIp(req) || "";
  reqContext.device = extractDeviceNameAndIp(req);
  try {
    reqContext.location = await iplocation(reqContext.requestId);
  } catch (_) {
    // it throws error when provided with invalid ip address
  }

  req.context = reqContext;

  next();
}

export function extractDeviceNameAndIp(req: Request) {
  const deviceDetector = new DeviceDetector();
  const deviceDetails = deviceDetector.parse(req.headers["user-agent"]!);
  let deviceName!: string;

  if (deviceDetails.device)
    deviceName = deviceDetails.device.model
      ? deviceDetails.device.model
      : deviceDetails.device.brand
      ? `${deviceDetails.device.brand} ${deviceDetails.device.type}`
      : "";
  if (!deviceName && deviceDetails.os)
    deviceName = `${deviceDetails.os.platform} ${deviceDetails.os.name} ${deviceDetails.os.version}`;
  if (!deviceName && deviceDetails.client)
    deviceName = `${deviceDetails.client.name} ${deviceDetails.client.type} ${deviceDetails.client.version}`;

  if (!deviceName) deviceName = "Unknown";

  return new DeviceDto({
    name: deviceName,
    isBot: !!deviceDetails.bot,
  });
}
