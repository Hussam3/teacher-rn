/**
 * خدمة مزامنة واسترجاع فهرس المناهج وروابط الـ PDF من Supabase.
 */
import { supabase } from './supabase';
import { ALL_CURRICULUM_BOOKS, type CurriculumBook } from './curriculumCatalog';

export interface RemoteCurriculumBook {
  book_id: string;
  title: string;
  stage: string;
  grade: string;
  subject: string;
  file_name: string;
  total_pages: number;
  chapters_count: number;
  chapters: Array<{
    title: string;
    page: number;
    endPage: number;
  }>;
}

class CurriculumSupabaseService {
  /**
   * جلب فهرس المناهج من Supabase
   */
  async fetchMasterIndex(): Promise<RemoteCurriculumBook[]> {
    try {
      const { data, error } = await supabase
        .from('curriculum_master_index')
        .select('*')
        .order('stage', { ascending: true });

      if (error || !data) {
        return [];
      }
      return data as RemoteCurriculumBook[];
    } catch {
      return [];
    }
  }

  /**
   * جلب روابط الـ PDF المحدثة من Supabase
   */
  async fetchPdfCatalog(): Promise<CurriculumBook[]> {
    try {
      const { data, error } = await supabase
        .from('curriculum_pdf_catalog')
        .select('*');

      if (error || !data || data.length === 0) {
        return ALL_CURRICULUM_BOOKS;
      }

      return data.map(d => ({
        id: d.id || d.file_name,
        title: d.subject + (d.type_or_part ? ` (${d.type_or_part})` : ''),
        subjectName: d.subject,
        typeOrPart: d.type_or_part || '',
        stage: d.stage,
        grade: d.grade,
        fileName: d.file_name,
        driveId: d.drive_id || '',
        viewUrl: d.view_url,
        downloadUrl: d.download_url,
        hasPdf: true,
      }));
    } catch {
      return ALL_CURRICULUM_BOOKS;
    }
  }
}

export const curriculumSupabaseService = new CurriculumSupabaseService();
