export enum PermLogErrorCodeEnum {
  /**
   * Error with rabbitmq initialization
   */
  RabbitInit = "Rabbit.Init",
  /**
   * It is of great importance to ensure an error
   * cannot be classified before designating it as unknown
   */
  Unknown = "Unknown",
}

export class PermLogError extends Error {
  /**
   * to identify the error internally
   */
  name!: PermLogErrorCodeEnum;
  /**
   * message that can be shown to users
   */
  message!: string;
  /**
   * any other information that can help with the error
   */
  data?: any;

  constructor(dto?: PermLogError) {
    super(dto?.message);
    if (dto) Object.assign(this, dto);
  }
}
