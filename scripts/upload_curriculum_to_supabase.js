/**
 * سكريبت رفع وتحديث بيانات المناهج وبنك الأسئلة وروابط الـ PDF على قاعدة بيانات Supabase.
 */
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { loadLocalEnv } = require('./load-local-env');

loadLocalEnv();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://yqqedfjadgyktiohkuwg.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is required to publish curriculum data.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function uploadCurriculumData() {
  console.log('🚀 بدء رفع بيانات المناهج إلى Supabase...');

  // 1. قراءة الفهرس الشامل
  const masterIndexPath = path.join(__dirname, '../json_books/curriculum_master_index.json');
  if (fs.existsSync(masterIndexPath)) {
    const masterData = JSON.parse(fs.readFileSync(masterIndexPath, 'utf8'));
    console.log(`📚 تم العثور على ${masterData.books.length} كتاباً في الفهرس الشامل.`);

    const records = masterData.books.map(b => ({
      book_id: b.id,
      title: b.title,
      stage: b.stage,
      grade: b.grade,
      subject: b.subject,
      file_name: b.fileName,
      total_pages: b.totalPages,
      chapters_count: b.chaptersCount,
      chapters: b.chapters || [],
      metadata: {
        part: b.part,
        bookType: b.bookType,
        textLength: b.textLength,
        questionSectionsCount: b.questionSectionsCount,
      },
    }));

    // رفع على دفعات من 20 كتاب
    for (let i = 0; i < records.length; i += 20) {
      const batch = records.slice(i, i + 20);
      const { error } = await supabase.from('curriculum_master_index').upsert(batch, { onConflict: 'book_id' });
      if (error) {
        throw new Error(`فشل رفع الفهرس (دفعة ${i}): ${error.message}`);
      }
      console.log(`✅ تم رفع الكتب ${i + 1} إلى ${Math.min(i + 20, records.length)}.`);
    }
  }

  // 2. قراءة بنك الأسئلة والتمارين الوزارية
  const questionsPath = path.join(__dirname, '../json_books/questions_bank.json');
  if (fs.existsSync(questionsPath)) {
    const questionsData = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));
    console.log(`❓ تم العثور على ${questionsData.questions.length} سؤالاً في بنك الأسئلة.`);

    const qRecords = questionsData.questions.map(q => ({
      question_id: q.id,
      book_id: q.bookFileName,
      stage: q.stage,
      grade: q.grade,
      subject: q.subject,
      chapter_title: q.chapter,
      page_number: q.page,
      question_type: q.type || 'general',
      // The extractor stores a concise prompt plus optional sub-questions.
      // Keep them separate so the editor can render them as editable branches.
      question_text: q.branches?.length ? q.prompt : q.fullText || q.prompt,
      branches: (q.branches || []).map(text => ({ text, score: '' })),
      score: '',
    }));

    for (let i = 0; i < qRecords.length; i += 50) {
      const batch = qRecords.slice(i, i + 50);
      const { error } = await supabase.from('curriculum_questions_bank').upsert(batch, { onConflict: 'question_id' });
      if (error) {
        throw new Error(`فشل رفع بنك الأسئلة (دفعة ${i}): ${error.message}`);
      }
      console.log(`✅ تم رفع الأسئلة ${i + 1} إلى ${Math.min(i + 50, qRecords.length)}.`);
    }
  }

  // 3. قراءة كتالوج روابط الـ PDF
  const pdfPath = path.join(__dirname, '../src/services/curriculumCatalog.ts');
  if (fs.existsSync(pdfPath)) {
    const { ALL_CURRICULUM_BOOKS } = require('../src/services/curriculumCatalog.ts');
    if (ALL_CURRICULUM_BOOKS && ALL_CURRICULUM_BOOKS.length > 0) {
      console.log(`📑 تم العثور على ${ALL_CURRICULUM_BOOKS.length} رابط PDF.`);
      const pdfRecords = ALL_CURRICULUM_BOOKS.map(b => ({
        file_name: b.fileName,
        stage: b.stage,
        grade: b.grade,
        subject: b.subjectName,
        type_or_part: b.typeOrPart || '',
        drive_id: b.driveId || '',
        view_url: b.viewUrl,
        download_url: b.downloadUrl,
      }));

      for (let i = 0; i < pdfRecords.length; i += 30) {
        const batch = pdfRecords.slice(i, i + 30);
        const { error } = await supabase.from('curriculum_pdf_catalog').upsert(batch, { onConflict: 'file_name' });
        if (error) {
          throw new Error(`فشل رفع كتالوج PDF (دفعة ${i}): ${error.message}`);
        }
        console.log(`✅ تم رفع روابط الـ PDF ${i + 1} إلى ${Math.min(i + 30, pdfRecords.length)}.`);
      }
    }
  }

  console.log('🎉 اكتملت عملية التجهيز والرفع بنجاح!');
}

uploadCurriculumData().catch(err => {
  console.error('❌ حدث خطأ:', err);
  process.exitCode = 1;
});
