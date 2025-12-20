import { ISheetMarkerRepository } from '~domain/sheet/model/ISheetMarkerRepository';
import { ISheetRepository } from '~domain/sheet/model/ISheetRepository';
import { SheetMarker } from '~domain/sheet/model/SheetMarker';
import { CreateSheetMarkerInput } from '../dto/CreateSheetMarkerInput';
import { SheetMarkerOutput } from '../dto/SheetMarkerOutput';
import { v4 as uuidv4 } from 'uuid';

export class CreateSheetMarker {
  constructor(
    private sheetMarkerRepository: ISheetMarkerRepository,
    private sheetRepository: ISheetRepository
  ) {}

  async execute(sheetId: string, input: CreateSheetMarkerInput): Promise<SheetMarkerOutput> {
    // #region agent log
    await fetch('http://127.0.0.1:7245/ingest/befb475b-e854-40df-ba29-979341b8a7a4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CreateSheetMarker.ts:execute',message:'Use case called',data:{sheetId,input},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    
    const sheet = await this.sheetRepository.findById(sheetId);
    if (!sheet) {
      // #region agent log
      await fetch('http://127.0.0.1:7245/ingest/befb475b-e854-40df-ba29-979341b8a7a4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CreateSheetMarker.ts:execute',message:'Sheet not found',data:{sheetId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      throw new Error('Sheet not found');
    }

    // #region agent log
    await fetch('http://127.0.0.1:7245/ingest/befb475b-e854-40df-ba29-979341b8a7a4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CreateSheetMarker.ts:execute',message:'Sheet found, creating marker',data:{sheetId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion

    const marker = SheetMarker.create(
      uuidv4(),
      sheetId,
      null,
      input.type,
      input.x,
      input.y,
      input.width,
      input.height,
      input.note
    );

    // #region agent log
    await fetch('http://127.0.0.1:7245/ingest/befb475b-e854-40df-ba29-979341b8a7a4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CreateSheetMarker.ts:execute',message:'Marker created, saving',data:{markerId:marker.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion

    const savedMarker = await this.sheetMarkerRepository.save(marker);

    // #region agent log
    await fetch('http://127.0.0.1:7245/ingest/befb475b-e854-40df-ba29-979341b8a7a4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CreateSheetMarker.ts:execute',message:'Marker saved successfully',data:{savedMarkerId:savedMarker.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion

    return new SheetMarkerOutput(
      savedMarker.id,
      savedMarker.sheetId,
      savedMarker.sheetVersionId,
      savedMarker.type,
      savedMarker.x,
      savedMarker.y,
      savedMarker.width,
      savedMarker.height,
      savedMarker.note,
      savedMarker.createdAt,
      savedMarker.updatedAt
    );
  }
}

