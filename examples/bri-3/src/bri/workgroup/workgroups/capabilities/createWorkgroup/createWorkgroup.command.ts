export class CreateWorkgroupCommand {
  constructor(
    public readonly accessToken: string,
    public readonly name: string,
    public readonly securityPolicy: string,
    public readonly privacyPolicy: string,
    public readonly workstepIds: string[],
    public readonly workflowIds: string[],
  ) {}
}
