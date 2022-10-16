import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BpiAccountAgent } from '../../agents/bpiAccounts.agent';
import { BpiAccountStorageAgent } from '../../agents/bpiAccountsStorage.agent';
import { CreateBpiAccountCommand } from './createBpiAccount.command';

@CommandHandler(CreateBpiAccountCommand)
export class CreateBpiAccountCommandHandler
  implements ICommandHandler<CreateBpiAccountCommand>
{
  constructor(
    private agent: BpiAccountAgent,
    private storageAgent: BpiAccountStorageAgent,
  ) {}

  async execute() {
    this.agent.throwIfCreateBpiAccountInputInvalid();

    const newBpiSubjectCandidate = this.agent.createNewBpiAccount();

    const newBpiSubject = await this.storageAgent.createNewBpiAccount(
      newBpiSubjectCandidate,
    );

    return newBpiSubject.id;
  }
}
