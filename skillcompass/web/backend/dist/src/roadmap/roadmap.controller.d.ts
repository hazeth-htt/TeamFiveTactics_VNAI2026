import { RoadmapService } from './roadmap.service';
export declare class RoadmapController {
    private readonly roadmapService;
    constructor(roadmapService: RoadmapService);
    createRoadmap(body: any): Promise<any>;
}
