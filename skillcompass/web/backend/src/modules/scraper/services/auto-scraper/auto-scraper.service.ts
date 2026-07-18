import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { AiExtractionService } from '../ai-extraction/ai-extraction.service';

@Injectable()
export class AutoScraperService {
  private readonly logger = new Logger(AutoScraperService.name);

  private getSitemapsForSource(source: 'all' | 'timviec365' | 'topcv', limit: number = 2): string[] {
    const timviec365Sitemaps = [
      'https://timviec365.vn/sitemap-job.xml',
      'https://timviec365.vn/sitemap-job2.xml',
      'https://timviec365.vn/sitemap-job3.xml',
      'https://timviec365.vn/sitemap-job4.xml',
      'https://timviec365.vn/sitemap-job5.xml',
      'https://timviec365.vn/sitemap-job6.xml',
    ];

    // Pick dynamic number of sitemaps based on limit (e.g. limit = 10 -> pick 5 sitemaps)
    const numTopCvSitemapsToPick = Math.max(2, Math.min(10, Math.ceil(limit / 2)));
    const topCvSitemaps: string[] = [];
    const pickedIndices = new Set<number>();
    
    while (pickedIndices.size < Math.min(250, numTopCvSitemapsToPick)) {
      const randIndex = Math.floor(Math.random() * 250); // 0 to 249
      pickedIndices.add(randIndex);
    }
    
    for (const idx of pickedIndices) {
      topCvSitemaps.push(`https://www.topcv.vn/sitemap/jobs_${idx}.xml`);
    }

    if (source === 'timviec365') return timviec365Sitemaps;
    if (source === 'topcv') return topCvSitemaps;
    
    // For 'all', merge them
    return [...timviec365Sitemaps, ...topCvSitemaps];
  }

  // Group keywords based on the 5 frameworks
  private readonly keywords = {
    it: ['lap-trinh', 'devops', 'developer', 'it-', 'phan-mem', 'he-thong', 'du-lieu', 'data', 'an-ninh-mang', 'cloud', 'tester', 'qa', 'qc', 'frontend', 'backend', 'fullstack'],
    business: ['kinh-doanh', 'sales', 'marketing', 'nhan-su', 'hr', 'tai-chinh', 'ke-toan', 'quang-cao', 'tu-van', 'cskh', 'ban-hang'],
    art: ['thiet-ke', 'designer', 'ui-ux', 'do-hoa', 'sang-tao', 'content', 'multimedia', 'my-thuat', 've'],
    vocational: ['o-to', 'co-khi', 'dien-tu', 'dien-cong-nghiep', 'plc', 'dau-bep', 'nha-hang', 'y-ta', 'dieu-duong', 'han', 'may', 'moc', 'sua-chua', 'lai-xe', 'spa', 'cat-toc'],
  };

  constructor(private readonly aiExtractionService: AiExtractionService) {}

  /**
   * Main trigger to start the scraping process
   * @param limitPerGroup Maximum job postings to process per category to control API cost
   * @param source Scraper source filter ('all' | 'timviec365' | 'topcv')
   */
  async startScraping(limit = 2, source: 'all' | 'timviec365' | 'topcv' = 'all'): Promise<any> {
    this.logger.log(`Starting scraper for source: ${source}. Sampling limit: ${limit} total jobs.`);
    const results = {
      total_processed: 0,
      errors: [] as any[],
    };

    const processedUrls = new Set<string>();

    const targetSitemaps = this.getSitemapsForSource(source, limit);
    for (const sitemapUrl of targetSitemaps) {
      try {
        this.logger.log(`Fetching sitemap: ${sitemapUrl}`);
        const sitemapData = await this.fetchHtml(sitemapUrl);
        const $ = cheerio.load(sitemapData, { xmlMode: true });

        // 1. Check if the sitemap itself has embedded JSON-LD (Schema.org JobPosting)
        // (Sometimes in pretty sitemaps or custom feeds)
        const jsonLdScripts = $('script[type="application/ld+json"]');
        if (jsonLdScripts.length > 0) {
          this.logger.log(`Found ${jsonLdScripts.length} JSON-LD script blocks directly in sitemap!`);
          for (let i = 0; i < jsonLdScripts.length; i++) {
            try {
              const scriptContent = $(jsonLdScripts[i]).html();
              if (!scriptContent) continue;
              const jsonLd = JSON.parse(scriptContent);
              
              // Process if it is a JobPosting or array of JobPostings
              const jobPostings = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
              for (const job of jobPostings) {
                if (job['@type'] === 'JobPosting') {
                  const jobUrl = job.url || sitemapUrl;
                  if (processedUrls.has(jobUrl)) continue;

                  const category = this.categorizeJob(job.title || '', jobUrl);
                  this.logger.log(`Processing direct sitemap job: "${job.title}"`);
                  await this.aiExtractionService.extractAndSave(job, category);
                  
                  results.total_processed++;
                  processedUrls.add(jobUrl);

                  if (results.total_processed >= limit) {
                    this.logger.log(`Sampling limit of ${limit} reached.`);
                    return results;
                  }
                }
              }
            } catch (err) {
              this.logger.error(`Error parsing direct sitemap JSON-LD: ${err.message}`);
            }
          }
        }

        // 2. Standard sitemap parsing: Extract URLs from <loc> tags
        const urls: string[] = [];
        $('loc').each((_, element) => {
          const url = $(element).text().trim();
          if (url && url.startsWith('http')) {
            urls.push(url);
          }
        });

        this.logger.log(`Extracted ${urls.length} URLs from sitemap.`);
        if (urls.length === 0) continue;

        // Shuffle/Randomize sitemap URLs to get a diverse sample
        const shuffledUrls = urls.sort(() => 0.5 - Math.random());

        for (const url of shuffledUrls) {
          if (processedUrls.has(url)) continue;

          // Fetch job detail page and extract JSON-LD
          try {
            this.logger.log(`Crawling job page: ${url}`);
            // Sleep to be polite (1 - 2 seconds)
            await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));

            const pageHtml = await this.fetchHtml(url);
            const page$ = cheerio.load(pageHtml);
            let foundJobPosting = false;

            const scripts = page$('script[type="application/ld+json"]').toArray();
            for (const el of scripts) {
              try {
                const scriptText = page$(el).html();
                if (!scriptText) continue;
                const jsonLd = JSON.parse(scriptText);
                const jobPostings = Array.isArray(jsonLd) ? jsonLd : [jsonLd];

                for (const job of jobPostings) {
                  if (job['@type'] === 'JobPosting') {
                    // Enrich with URL
                    job.url = url;
                    const finalCategory = this.categorizeJob(job.title || '', url);

                    this.logger.log(`Extracting JSON-LD for job: "${job.title}"`);
                    await this.aiExtractionService.extractAndSave(job, finalCategory);

                    results.total_processed++;
                    processedUrls.add(url);
                    foundJobPosting = true;

                    if (results.total_processed >= limit) {
                      this.logger.log(`Sampling limit of ${limit} reached.`);
                      return results;
                    }
                  }
                }
              } catch (e) {
                // Ignore json parse error for non-job-posting json-lds
              }
            }

            if (!foundJobPosting) {
              // Fallback: If no JSON-LD found, parse HTML content directly (title, company, description)
              this.logger.log(`No JSON-LD found for ${url}. Attempting HTML fallback parsing.`);
              let jobTitle = page$('h1').text().trim();
              if (!jobTitle) {
                jobTitle = page$('.job-detail__info-title').text().trim() || page$('.title-job').text().trim() || page$('.title_cum').text().trim();
              }
              
              let companyName = '';
              const companyElements = [
                page$('a.name'),
                page$('.company-name-label'),
                page$('.box-company-info__detail'),
                page$('.company-name'),
                page$('.box-company')
              ];
              for (const el of companyElements) {
                const text = el.text().trim();
                if (text && text !== 'Công ty Cổ phần TopCV Việt Nam' && text.length < 150) {
                  companyName = text;
                  break;
                }
              }
              if (!companyName) {
                companyName = 'TopCV Employer';
              }

              // Extract description & requirements for TopCV specifically
              let description = '';
              let requirements = '';
              
              page$('.box-job-information-detail-item__title').each((_, el) => {
                const headerText = page$(el).text().trim();
                if (headerText === 'Mô tả công việc') {
                  description = page$(el).next().text().trim();
                } else if (headerText === 'Yêu cầu ứng viên') {
                  requirements = page$(el).next().text().trim();
                }
              });

              if (!description) {
                description = page$('.job-detail__body').text().trim() || page$('.job-description').text().trim() || page$('.mo_ta').text().trim() || page$('.tv_muctieu').text().trim();
              }
              if (!requirements) {
                requirements = page$('.job-requirements').text().trim() || page$('.yeu_cau').text().trim() || page$('.box-info').text().trim();
              }
              const salaryText = page$('.luong').text().trim() || page$('.muc_luong').text().trim() || page$('.job-detail__info-salary').text().trim();
              const locationText = page$('.dia_diem').text().trim() || page$('.box-salary').text().trim() || page$('.job-detail__info-location').text().trim();

              if (jobTitle && description) {
                const fallbackJob = {
                  '@type': 'JobPosting',
                  title: jobTitle,
                  description: `${description}\n\nYêu cầu:\n${requirements}`,
                  hiringOrganization: { name: companyName },
                  baseSalary: { value: salaryText },
                  jobLocation: { address: { addressRegion: locationText } },
                  url: url,
                };

                const finalCategory = this.categorizeJob(jobTitle, url);
                this.logger.log(`Extracting via fallback for job: "${jobTitle}"`);
                await this.aiExtractionService.extractAndSave(fallbackJob, finalCategory);

                results.total_processed++;
                processedUrls.add(url);

                if (results.total_processed >= limit) {
                  this.logger.log(`Sampling limit of ${limit} reached.`);
                  return results;
                }
              }
            }
          } catch (pageErr) {
            this.logger.error(`Error crawling page ${url}: ${pageErr.message}`);
            results.errors.push({ url, error: pageErr.message });
          }
        }
      } catch (sitemapErr) {
        this.logger.error(`Error processing sitemap ${sitemapUrl}: ${sitemapErr.message}`);
        results.errors.push({ sitemap: sitemapUrl, error: sitemapErr.message });
      }
    }

    return results;
  }

  /**
   * Helper to categorize job based on title and URL
   */
  private categorizeJob(title: string, url: string): string {
    const textToSearch = `${title.toLowerCase()} ${url.toLowerCase()}`;

    for (const [category, kwList] of Object.entries(this.keywords)) {
      for (const kw of kwList) {
        if (textToSearch.includes(kw)) {
          return category;
        }
      }
    }

    return 'general';
  }

  /**
   * Helper to fetch HTML from a URL using curl.exe on Windows for TopCV to bypass Cloudflare TLS fingerprinting,
   * or axios as a standard fallback for other sources.
   */
  private async fetchHtml(url: string): Promise<string> {
    const isTopCv = url.includes('topcv.vn');
    
    if (isTopCv) {
      this.logger.log(`[BYPASS] using curl.exe to fetch TopCV URL: ${url}`);
      return new Promise((resolve, reject) => {
        const { exec } = require('child_process');
        const escapedUrl = url.replace(/"/g, '\\"');
        const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
        
        exec(`curl.exe -s -L -A "${userAgent}" "${escapedUrl}"`, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
          if (error) {
            reject(new Error(`curl failed: ${error.message}`));
          } else {
            resolve(stdout);
          }
        });
      });
    } else {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
        timeout: 15000,
      });
      return response.data;
    }
  }
}
