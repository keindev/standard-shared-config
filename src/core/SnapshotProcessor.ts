import { Task } from 'tasktree-cli/lib/Task';

import { ISnapshot } from '../types';

export default class SnapshotProcessor {
  async process(snapshots: ISnapshot[], task: Task): Promise<void> {
    await Promise.all(snapshots.map(snapshot => this.processSnapshot(snapshot, task)));
  }

  private async processSnapshot(snapshot: ISnapshot, task: Task): Promise<void> {
    // TODO: create files from snapshots
    await Promise.resolve();

    task.log(`${snapshot.path} created`);
  }
}
