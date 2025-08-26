import { ImportService } from './import-service.js';

export class ImportScheduler {
  private importService: ImportService;
  private isRunning = false;

  constructor() {
    this.importService = new ImportService();
  }

  async startDailyImports(): Promise<void> {
    if (this.isRunning) {
      console.log('Daily import scheduler is already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting daily import scheduler...');

    // Run immediately on start
    await this.runDailyImport();

    // Schedule to run every 24 hours (86400000 ms)
    setInterval(async () => {
      if (this.isRunning) {
        await this.runDailyImport();
      }
    }, 24 * 60 * 60 * 1000);
  }

  stopDailyImports(): void {
    this.isRunning = false;
    console.log('Daily import scheduler stopped');
  }

  private async runDailyImport(): Promise<void> {
    console.log('Starting scheduled daily import...');
    
    try {
      // Import latest 20 mobiles daily
      const results = await this.importService.importLatestMobiles(20);
      console.log(`Daily import completed: ${results.success} new mobiles imported`);
      
      if (results.errors.length > 0) {
        console.error('Daily import had errors:', results.errors);
      }
    } catch (error) {
      console.error('Daily import failed:', error);
    }
  }

  async runWeeklyUpdate(): Promise<{ success: number; errors: string[] }> {
    console.log('Starting scheduled weekly update...');
    
    try {
      // Import brands first
      const brandResults = await this.importService.importBrands();
      
      // Then import popular brands with more phones
      const popularResults = await this.importService.importPopularBrands();

      const totalResults = {
        success: brandResults.success + popularResults.success,
        errors: [...brandResults.errors, ...popularResults.errors]
      };

      console.log(`Weekly update completed: ${totalResults.success} total items imported`);
      return totalResults;
    } catch (error) {
      console.error('Weekly update failed:', error);
      return { success: 0, errors: [error instanceof Error ? error.message : 'Unknown error'] };
    }
  }

  getStatus(): { isRunning: boolean; nextRun?: string } {
    return {
      isRunning: this.isRunning,
      nextRun: this.isRunning ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : undefined
    };
  }
}

// Global instance
export const importScheduler = new ImportScheduler();