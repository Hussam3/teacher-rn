/**
 * بيانات وفهرس المناهج الدراسية العراقية المعتمدة (توليد آلي من json_books).
 * تاريخ التوليد: 2026-08-26T22:13:20.587Z
 * إجمالي الكتب: 124 (المعتمدة: 95)
 */

export interface MasterBookMetadata {
  id: string;
  fileName: string;
  title: string;
  stage: string;
  grade: string;
  subject: string;
  part: string;
  bookType: string;
  editionNotes?: string;
  isCanonical: boolean;
  status: 'ready' | 'alternative_edition' | 'scanned_pdf_only' | 'empty';
  fileSizeBytes: number;
  totalPages: number;
  nonEmptyPages: number;
  textLength: number;
  chaptersCount: number;
  questionSectionsCount: number;
}

export interface CurriculumHierarchy {
  [stage: string]: {
    [grade: string]: {
      [subjectDisplay: string]: {
        fileName: string;
        subject: string;
        part: string;
        bookType: string;
        totalPages: number;
        nonEmptyPages: number;
        textLength: number;
        chaptersCount: number;
        questionSectionsCount: number;
        editionNotes?: string;
      };
    };
  };
}

export const CURRICULUM_STAGES: CurriculumHierarchy = {
  "المتوسطة": {
    "الثالث المتوسط": {
      "الاجتماعيات": {
        "fileName": "كتاب الاجتماعيات الثالث المتوسط.json",
        "subject": "الاجتماعيات",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 160,
        "nonEmptyPages": 159,
        "textLength": 202305,
        "chaptersCount": 1,
        "questionSectionsCount": 0,
        "editionNotes": ""
      },
      "التربية الإسلامية": {
        "fileName": "كتاب الاسلامية الثالث المتوسط.json",
        "subject": "التربية الإسلامية",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 156,
        "nonEmptyPages": 156,
        "textLength": 166836,
        "chaptersCount": 0,
        "questionSectionsCount": 0,
        "editionNotes": ""
      },
      "الفيزياء": {
        "fileName": "كتاب الفيزياء الثالث المتوسط.json",
        "subject": "الفيزياء",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 176,
        "nonEmptyPages": 176,
        "textLength": 169212,
        "chaptersCount": 14,
        "questionSectionsCount": 9,
        "editionNotes": ""
      },
      "الكيمياء": {
        "fileName": "كتاب الكيمياء الثالث المتوسط.json",
        "subject": "الكيمياء",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 152,
        "nonEmptyPages": 115,
        "textLength": 135797,
        "chaptersCount": 9,
        "questionSectionsCount": 6,
        "editionNotes": ""
      },
      "اللغة الإنجليزية": {
        "fileName": "كتاب_الانكليزي_الطالب_الثالث_المتوسط.json",
        "subject": "اللغة الإنجليزية",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 120,
        "nonEmptyPages": 14,
        "textLength": 20046,
        "chaptersCount": 0,
        "questionSectionsCount": 0,
        "editionNotes": ""
      },
      "اللغة الإنجليزية [كتاب النشاط / التمرينات]": {
        "fileName": "كتاب_الانكليزي_النشاط_الثالث_المتوسط.json",
        "subject": "اللغة الإنجليزية",
        "part": "كامل",
        "bookType": "كتاب النشاط / التمرينات",
        "totalPages": 124,
        "nonEmptyPages": 18,
        "textLength": 18395,
        "chaptersCount": 0,
        "questionSectionsCount": 0,
        "editionNotes": ""
      },
      "اللغة العربية": {
        "fileName": "كتاب_اللغة_العربية_الصف_الثالث_متوسط2026.json",
        "subject": "اللغة العربية",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 129,
        "nonEmptyPages": 120,
        "textLength": 188122,
        "chaptersCount": 0,
        "questionSectionsCount": 0,
        "editionNotes": "طبعة 2026 مع التقليص الجديد"
      }
    },
    "الثاني المتوسط": {
      "الاجتماعيات": {
        "fileName": "كتاب الاجتماعيات الثاني المتوسط.json",
        "subject": "الاجتماعيات",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 140,
        "nonEmptyPages": 140,
        "textLength": 157612,
        "chaptersCount": 6,
        "questionSectionsCount": 0,
        "editionNotes": ""
      },
      "الأحياء": {
        "fileName": "كتاب الاحياء الثاني المتوسط.json",
        "subject": "الأحياء",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 92,
        "nonEmptyPages": 91,
        "textLength": 125853,
        "chaptersCount": 0,
        "questionSectionsCount": 0,
        "editionNotes": ""
      },
      "التربية الإسلامية": {
        "fileName": "كتاب الاسلامية الثاني المتوسط.json",
        "subject": "التربية الإسلامية",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 120,
        "nonEmptyPages": 106,
        "textLength": 111613,
        "chaptersCount": 4,
        "questionSectionsCount": 0,
        "editionNotes": ""
      },
      "الحاسوب": {
        "fileName": "كتاب الحاسوب الثاني المتوسط.json",
        "subject": "الحاسوب",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 144,
        "nonEmptyPages": 143,
        "textLength": 132374,
        "chaptersCount": 6,
        "questionSectionsCount": 1,
        "editionNotes": ""
      },
      "الرياضيات": {
        "fileName": "كتاب الرياضيات الثاني المتوسط.json",
        "subject": "الرياضيات",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 196,
        "nonEmptyPages": 196,
        "textLength": 245916,
        "chaptersCount": 0,
        "questionSectionsCount": 7,
        "editionNotes": ""
      },
      "الفيزياء": {
        "fileName": "كتاب الفيزياء الثاني المتوسط.json",
        "subject": "الفيزياء",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 88,
        "nonEmptyPages": 83,
        "textLength": 102269,
        "chaptersCount": 0,
        "questionSectionsCount": 0,
        "editionNotes": ""
      },
      "الكيمياء": {
        "fileName": "كتاب الكيمياء الثاني المتوسط.json",
        "subject": "الكيمياء",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 96,
        "nonEmptyPages": 96,
        "textLength": 118065,
        "chaptersCount": 0,
        "questionSectionsCount": 0,
        "editionNotes": ""
      },
      "التربية الأخلاقية": {
        "fileName": "كتاب_التربية_الاخلاقية_الثاني_المتوسط.json",
        "subject": "التربية الأخلاقية",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 128,
        "nonEmptyPages": 128,
        "textLength": 256376,
        "chaptersCount": 1,
        "questionSectionsCount": 0,
        "editionNotes": ""
      },
      "اللغة الفرنسية": {
        "fileName": "كتاب_الطالب_الفرنسي_الثاني_متوسط_المنهج_الجديد.json",
        "subject": "اللغة الفرنسية",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 108,
        "nonEmptyPages": 107,
        "textLength": 74560,
        "chaptersCount": 0,
        "questionSectionsCount": 0,
        "editionNotes": "المنهج الجديد"
      },
      "اللغة العربية (الجزء الأول)": {
        "fileName": "كتاب_العربي_الثاني_المتوسط_الجزء_الاول.json",
        "subject": "اللغة العربية",
        "part": "الجزء الأول",
        "bookType": "كتاب الطالب",
        "totalPages": 136,
        "nonEmptyPages": 129,
        "textLength": 166944,
        "chaptersCount": 0,
        "questionSectionsCount": 0,
        "editionNotes": ""
      },
      "اللغة العربية (الجزء الثاني)": {
        "fileName": "كتاب_العربي_الثاني_المتوسط_الجزء_الثاني.json",
        "subject": "اللغة العربية",
        "part": "الجزء الثاني",
        "bookType": "كتاب الطالب",
        "totalPages": 136,
        "nonEmptyPages": 132,
        "textLength": 126480,
        "chaptersCount": 0,
        "questionSectionsCount": 0,
        "editionNotes": ""
      }
    },
    "الأول المتوسط": {
      "الاجتماعيات": {
        "fileName": "كتاب الاجتماعيات اول متوسط.json",
        "subject": "الاجتماعيات",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 132,
        "nonEmptyPages": 132,
        "textLength": 144467,
        "chaptersCount": 0,
        "questionSectionsCount": 0,
        "editionNotes": ""
      },
      "الأحياء": {
        "fileName": "كتاب الاحياء اول متوسط.json",
        "subject": "الأحياء",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 96,
        "nonEmptyPages": 95,
        "textLength": 117568,
        "chaptersCount": 2,
        "questionSectionsCount": 0,
        "editionNotes": ""
      },
      "التربية الإسلامية": {
        "fileName": "كتاب الاسلامية اول متوسط.json",
        "subject": "التربية الإسلامية",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 140,
        "nonEmptyPages": 86,
        "textLength": 55424,
        "chaptersCount": 0,
        "questionSectionsCount": 0,
        "editionNotes": ""
      },
      "التربية الأخلاقية": {
        "fileName": "كتاب التربية الاخلاقية اول متوسط.json",
        "subject": "التربية الأخلاقية",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 136,
        "nonEmptyPages": 135,
        "textLength": 174669,
        "chaptersCount": 3,
        "questionSectionsCount": 0,
        "editionNotes": ""
      },
      "الحاسوب": {
        "fileName": "كتاب الحاسوب اول متوسط.json",
        "subject": "الحاسوب",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 144,
        "nonEmptyPages": 111,
        "textLength": 130529,
        "chaptersCount": 2,
        "questionSectionsCount": 0,
        "editionNotes": ""
      },
      "الرياضيات": {
        "fileName": "كتاب الرياضيات اول متوسط.json",
        "subject": "الرياضيات",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 196,
        "nonEmptyPages": 195,
        "textLength": 224412,
        "chaptersCount": 0,
        "questionSectionsCount": 0,
        "editionNotes": ""
      },
      "الفيزياء": {
        "fileName": "كتاب الفيزياء اول متوسط.json",
        "subject": "الفيزياء",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 88,
        "nonEmptyPages": 88,
        "textLength": 104769,
        "chaptersCount": 0,
        "questionSectionsCount": 0,
        "editionNotes": ""
      },
      "الكيمياء": {
        "fileName": "كتاب الكيمياء اول متوسط.json",
        "subject": "الكيمياء",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 88,
        "nonEmptyPages": 88,
        "textLength": 101489,
        "chaptersCount": 0,
        "questionSectionsCount": 0,
        "editionNotes": ""
      },
      "اللغة العربية (الجزء الأول)": {
        "fileName": "كتاب_العربي_اول_متوسط_الجزء_الاول.json",
        "subject": "اللغة العربية",
        "part": "الجزء الأول",
        "bookType": "كتاب الطالب",
        "totalPages": 152,
        "nonEmptyPages": 151,
        "textLength": 180407,
        "chaptersCount": 0,
        "questionSectionsCount": 0,
        "editionNotes": ""
      },
      "اللغة العربية (الجزء الثاني)": {
        "fileName": "كتاب_العربي_اول_متوسط_الجزء_الثاني.json",
        "subject": "اللغة العربية",
        "part": "الجزء الثاني",
        "bookType": "كتاب الطالب",
        "totalPages": 132,
        "nonEmptyPages": 131,
        "textLength": 113676,
        "chaptersCount": 0,
        "questionSectionsCount": 0,
        "editionNotes": ""
      }
    },
    "المرحلة المتوسطة (شامل)": {
      "اللغة الفرنسية": {
        "fileName": "كتاب_الفرنسي_المرحلة_المتوسطة_المنهج_الجديد.json",
        "subject": "اللغة الفرنسية",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 164,
        "nonEmptyPages": 163,
        "textLength": 331000,
        "chaptersCount": 0,
        "questionSectionsCount": 0,
        "editionNotes": "المنهج الجديد"
      }
    }
  },
  "الإعدادية": {
    "الخامس الإعدادي": {
      "الأحياء": {
        "fileName": "كتاب الاحياء الخامس الاعدادي.json",
        "subject": "الأحياء",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 232,
        "nonEmptyPages": 232,
        "textLength": 303834,
        "chaptersCount": 58,
        "questionSectionsCount": 7,
        "editionNotes": ""
      },
      "التربية الإسلامية": {
        "fileName": "كتاب الاسلامية الخامس الاعدادي (2).json",
        "subject": "التربية الإسلامية",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 156,
        "nonEmptyPages": 142,
        "textLength": 139640,
        "chaptersCount": 1,
        "questionSectionsCount": 0,
        "editionNotes": ""
      },
      "الحاسوب": {
        "fileName": "كتاب الحاسوب الخامس الاعدادي.json",
        "subject": "الحاسوب",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 144,
        "nonEmptyPages": 136,
        "textLength": 165511,
        "chaptersCount": 2,
        "questionSectionsCount": 0,
        "editionNotes": ""
      },
      "الرياضيات": {
        "fileName": "كتاب الرياضيات الخامس الاعدادي.json",
        "subject": "الرياضيات",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 258,
        "nonEmptyPages": 192,
        "textLength": 1745,
        "chaptersCount": 1,
        "questionSectionsCount": 0,
        "editionNotes": ""
      },
      "اللغة الفرنسية": {
        "fileName": "كتاب الفرنسي الخامس الاعدادي.json",
        "subject": "اللغة الفرنسية",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 64,
        "nonEmptyPages": 58,
        "textLength": 1663,
        "chaptersCount": 0,
        "questionSectionsCount": 0,
        "editionNotes": ""
      },
      "اللغة الكردية": {
        "fileName": "كتاب الكردي الخامس الاعدادي.json",
        "subject": "اللغة الكردية",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 209,
        "nonEmptyPages": 207,
        "textLength": 74856,
        "chaptersCount": 0,
        "questionSectionsCount": 0,
        "editionNotes": ""
      },
      "الكيمياء": {
        "fileName": "كتاب الكيمياء الخامس الاعدادي.json",
        "subject": "الكيمياء",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 220,
        "nonEmptyPages": 205,
        "textLength": 330683,
        "chaptersCount": 1,
        "questionSectionsCount": 0,
        "editionNotes": ""
      },
      "علم الأرض": {
        "fileName": "كتاب علم الارض الخامس الاعدادي.json",
        "subject": "علم الأرض",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 132,
        "nonEmptyPages": 132,
        "textLength": 175071,
        "chaptersCount": 5,
        "questionSectionsCount": 0,
        "editionNotes": ""
      },
      "اللغة العربية (الجزء الأول)": {
        "fileName": "كتاب_العربي_الخامس_الاعدادي_الجزء_الاول.json",
        "subject": "اللغة العربية",
        "part": "الجزء الأول",
        "bookType": "كتاب الطالب",
        "totalPages": 140,
        "nonEmptyPages": 140,
        "textLength": 134316,
        "chaptersCount": 0,
        "questionSectionsCount": 0,
        "editionNotes": ""
      },
      "اللغة العربية (الجزء الثاني)": {
        "fileName": "كتاب_العربي_الخامس_الاعدادي_الجزء_الثاني.json",
        "subject": "اللغة العربية",
        "part": "الجزء الثاني",
        "bookType": "كتاب الطالب",
        "totalPages": 140,
        "nonEmptyPages": 140,
        "textLength": 144959,
        "chaptersCount": 0,
        "questionSectionsCount": 0,
        "editionNotes": ""
      }
    },
    "الرابع العلمي": {
      "الأحياء": {
        "fileName": "كتاب الاحياء الرابع العلمي.json",
        "subject": "الأحياء",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 192,
        "nonEmptyPages": 189,
        "textLength": 243670,
        "chaptersCount": 8,
        "questionSectionsCount": 8,
        "editionNotes": ""
      },
      "الرياضيات": {
        "fileName": "كتاب الرياضيات الرابع العلمي.json",
        "subject": "الرياضيات",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 156,
        "nonEmptyPages": 116,
        "textLength": 88035,
        "chaptersCount": 5,
        "questionSectionsCount": 0,
        "editionNotes": ""
      },
      "الفيزياء": {
        "fileName": "كتاب الفيزياء الرابع العلمي.json",
        "subject": "الفيزياء",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 188,
        "nonEmptyPages": 188,
        "textLength": 217566,
        "chaptersCount": 16,
        "questionSectionsCount": 28,
        "editionNotes": ""
      },
      "الكيمياء": {
        "fileName": "كتاب الكيمياء الرابع العلمي.json",
        "subject": "الكيمياء",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 148,
        "nonEmptyPages": 148,
        "textLength": 183198,
        "chaptersCount": 4,
        "questionSectionsCount": 3,
        "editionNotes": ""
      }
    },
    "السادس العلمي": {
      "الأحياء": {
        "fileName": "كتاب الاحياء السادس العلمي.json",
        "subject": "الأحياء",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 228,
        "nonEmptyPages": 17,
        "textLength": 1052,
        "chaptersCount": 0,
        "questionSectionsCount": 0,
        "editionNotes": ""
      },
      "الرياضيات": {
        "fileName": "كتاب الرياضيات السادس العلمي.json",
        "subject": "الرياضيات",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 240,
        "nonEmptyPages": 208,
        "textLength": 39220,
        "chaptersCount": 0,
        "questionSectionsCount": 0,
        "editionNotes": ""
      },
      "الفيزياء": {
        "fileName": "كتاب الفيزياء السادس العلمي.json",
        "subject": "الفيزياء",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 284,
        "nonEmptyPages": 82,
        "textLength": 96199,
        "chaptersCount": 3,
        "questionSectionsCount": 2,
        "editionNotes": ""
      },
      "الكيمياء": {
        "fileName": "كتاب الكيمياء السادس العلمي.json",
        "subject": "الكيمياء",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 288,
        "nonEmptyPages": 288,
        "textLength": 429922,
        "chaptersCount": 10,
        "questionSectionsCount": 7,
        "editionNotes": ""
      },
      "الأحياء [كتاب مؤشر / ملخص]": {
        "fileName": "كتاب_الاحياء_المؤشر_سالم_ال_منصور_السادس_العلمي_2025_الفصل_الاول.json",
        "subject": "الأحياء",
        "part": "كامل",
        "bookType": "كتاب مؤشر / ملخص",
        "totalPages": 62,
        "nonEmptyPages": 3,
        "textLength": 1132,
        "chaptersCount": 0,
        "questionSectionsCount": 0,
        "editionNotes": "طبعة 2025"
      }
    },
    "السادس الإعدادي": {
      "الأدب الإنجليزي": {
        "fileName": "كتاب الادب انكليزي سادس اعدادي.json",
        "subject": "الأدب الإنجليزي",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 29,
        "nonEmptyPages": 29,
        "textLength": 61184,
        "chaptersCount": 0,
        "questionSectionsCount": 0,
        "editionNotes": ""
      },
      "التربية الإسلامية": {
        "fileName": "كتاب الاسلامية السادس الاعدادي (2).json",
        "subject": "التربية الإسلامية",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 164,
        "nonEmptyPages": 161,
        "textLength": 177280,
        "chaptersCount": 0,
        "questionSectionsCount": 0,
        "editionNotes": ""
      },
      "اللغة الفرنسية": {
        "fileName": "كتاب_الفرنسي_المنهج_الجديد_الرابع_والخامس_والسادس_الاعدادي.json",
        "subject": "اللغة الفرنسية",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 171,
        "nonEmptyPages": 170,
        "textLength": 492548,
        "chaptersCount": 0,
        "questionSectionsCount": 0,
        "editionNotes": "المنهج الجديد"
      },
      "اللغة العربية (الجزء الأول)": {
        "fileName": "كتاب_العربي_السادس_الاعدادي_الجزء_الاول (2).json",
        "subject": "اللغة العربية",
        "part": "الجزء الأول",
        "bookType": "كتاب الطالب",
        "totalPages": 164,
        "nonEmptyPages": 163,
        "textLength": 188445,
        "chaptersCount": 1,
        "questionSectionsCount": 0,
        "editionNotes": ""
      },
      "اللغة العربية (الجزء الثاني)": {
        "fileName": "كتاب_العربي_السادس_الاعدادي_الجزء_الثاني (2).json",
        "subject": "اللغة العربية",
        "part": "الجزء الثاني",
        "bookType": "كتاب الطالب",
        "totalPages": 112,
        "nonEmptyPages": 111,
        "textLength": 151919,
        "chaptersCount": 4,
        "questionSectionsCount": 0,
        "editionNotes": ""
      }
    },
    "الرابع الإعدادي": {
      "التربية الإسلامية": {
        "fileName": "كتاب الاسلامية الرابع الاعدادي.json",
        "subject": "التربية الإسلامية",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 130,
        "nonEmptyPages": 130,
        "textLength": 149175,
        "chaptersCount": 4,
        "questionSectionsCount": 0,
        "editionNotes": ""
      },
      "الحاسوب": {
        "fileName": "كتاب الحاسوب الرابع الاعدادي.json",
        "subject": "الحاسوب",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 144,
        "nonEmptyPages": 144,
        "textLength": 161122,
        "chaptersCount": 7,
        "questionSectionsCount": 0,
        "editionNotes": ""
      },
      "اللغة الكردية": {
        "fileName": "كتاب الكردي الصف الرابع الاعدادي.json",
        "subject": "اللغة الكردية",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 174,
        "nonEmptyPages": 174,
        "textLength": 93787,
        "chaptersCount": 0,
        "questionSectionsCount": 0,
        "editionNotes": ""
      },
      "اللغة العربية (الجزء الأول)": {
        "fileName": "كتاب_العربي_الرابع_الاعدادي_الجزء_الاول.json",
        "subject": "اللغة العربية",
        "part": "الجزء الأول",
        "bookType": "كتاب الطالب",
        "totalPages": 140,
        "nonEmptyPages": 138,
        "textLength": 83964,
        "chaptersCount": 0,
        "questionSectionsCount": 0,
        "editionNotes": ""
      },
      "اللغة العربية (الجزء الثاني)": {
        "fileName": "كتاب_العربي_الرابع_الاعدادي_الجزء_الثاني.json",
        "subject": "اللغة العربية",
        "part": "الجزء الثاني",
        "bookType": "كتاب الطالب",
        "totalPages": 100,
        "nonEmptyPages": 96,
        "textLength": 48259,
        "chaptersCount": 0,
        "questionSectionsCount": 0,
        "editionNotes": ""
      },
      "جرائم حزب البعث": {
        "fileName": "كتاب_جرائم_حزب_البعث_الرابع_الاعدادي.json",
        "subject": "جرائم حزب البعث",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 96,
        "nonEmptyPages": 96,
        "textLength": 108491,
        "chaptersCount": 0,
        "questionSectionsCount": 0,
        "editionNotes": ""
      }
    },
    "السادس الأدبي": {
      "الاقتصاد": {
        "fileName": "كتاب الاقتصاد السادس الادبي.json",
        "subject": "الاقتصاد",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 112,
        "nonEmptyPages": 108,
        "textLength": 145121,
        "chaptersCount": 6,
        "questionSectionsCount": 2,
        "editionNotes": ""
      },
      "التاريخ": {
        "fileName": "كتاب التاريخ السادس الادبي.json",
        "subject": "التاريخ",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 204,
        "nonEmptyPages": 204,
        "textLength": 305722,
        "chaptersCount": 5,
        "questionSectionsCount": 1,
        "editionNotes": ""
      },
      "الجغرافية": {
        "fileName": "كتاب الجغرافية السادس الادبي.json",
        "subject": "الجغرافية",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 172,
        "nonEmptyPages": 171,
        "textLength": 296063,
        "chaptersCount": 6,
        "questionSectionsCount": 7,
        "editionNotes": ""
      },
      "الرياضيات": {
        "fileName": "كتاب الرياضيات السادس الادبي.json",
        "subject": "الرياضيات",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 140,
        "nonEmptyPages": 122,
        "textLength": 48955,
        "chaptersCount": 0,
        "questionSectionsCount": 0,
        "editionNotes": ""
      }
    },
    "الخامس الأدبي": {
      "التاريخ": {
        "fileName": "كتاب التاريخ الخامس الادبي.json",
        "subject": "التاريخ",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 112,
        "nonEmptyPages": 112,
        "textLength": 140266,
        "chaptersCount": 6,
        "questionSectionsCount": 0,
        "editionNotes": ""
      },
      "الجغرافية": {
        "fileName": "كتاب الجغرافية الخامس الادبي.json",
        "subject": "الجغرافية",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 162,
        "nonEmptyPages": 162,
        "textLength": 215729,
        "chaptersCount": 0,
        "questionSectionsCount": 0,
        "editionNotes": ""
      },
      "الرياضيات": {
        "fileName": "كتاب الرياضيات الخامس الادبي.json",
        "subject": "الرياضيات",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 128,
        "nonEmptyPages": 78,
        "textLength": 60955,
        "chaptersCount": 2,
        "questionSectionsCount": 1,
        "editionNotes": ""
      },
      "الفلسفة وعلم النفس": {
        "fileName": "كتاب_الفلسفة_وعلم_النفس_الخامس_الادبي.json",
        "subject": "الفلسفة وعلم النفس",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 136,
        "nonEmptyPages": 136,
        "textLength": 198717,
        "chaptersCount": 2,
        "questionSectionsCount": 0,
        "editionNotes": ""
      }
    },
    "الرابع الأدبي": {
      "التاريخ": {
        "fileName": "كتاب التاريخ الرابع الادبي.json",
        "subject": "التاريخ",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 180,
        "nonEmptyPages": 179,
        "textLength": 244764,
        "chaptersCount": 7,
        "questionSectionsCount": 3,
        "editionNotes": ""
      },
      "الجغرافية": {
        "fileName": "كتاب الجغرافية الرابع الادبي.json",
        "subject": "الجغرافية",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 144,
        "nonEmptyPages": 144,
        "textLength": 151154,
        "chaptersCount": 5,
        "questionSectionsCount": 0,
        "editionNotes": ""
      },
      "الرياضيات": {
        "fileName": "كتاب الرياضيات الرابع الادبي.json",
        "subject": "الرياضيات",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 112,
        "nonEmptyPages": 64,
        "textLength": 43846,
        "chaptersCount": 1,
        "questionSectionsCount": 0,
        "editionNotes": ""
      },
      "علم الاجتماع": {
        "fileName": "كتاب علم الاجتماع الرابع الادبي.json",
        "subject": "علم الاجتماع",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 108,
        "nonEmptyPages": 108,
        "textLength": 139679,
        "chaptersCount": 0,
        "questionSectionsCount": 0,
        "editionNotes": ""
      }
    }
  },
  "الابتدائية": {
    "الخامس الابتدائي": {
      "التربية الإسلامية": {
        "fileName": "كتاب الاسلامية الخامس الابتدائي.json",
        "subject": "التربية الإسلامية",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 96,
        "nonEmptyPages": 96,
        "textLength": 82999,
        "chaptersCount": 1,
        "questionSectionsCount": 0,
        "editionNotes": ""
      },
      "الرياضيات": {
        "fileName": "كتاب الرياضيات الخامس الابتدائي.json",
        "subject": "الرياضيات",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 198,
        "nonEmptyPages": 187,
        "textLength": 180181,
        "chaptersCount": 0,
        "questionSectionsCount": 5,
        "editionNotes": ""
      },
      "العلوم": {
        "fileName": "كتاب العلوم الخامس الابتدائي.json",
        "subject": "العلوم",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 200,
        "nonEmptyPages": 200,
        "textLength": 243610,
        "chaptersCount": 0,
        "questionSectionsCount": 0,
        "editionNotes": ""
      },
      "القراءة العربية": {
        "fileName": "كتاب القراءة الخامس الابتدائي.json",
        "subject": "القراءة العربية",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 162,
        "nonEmptyPages": 4,
        "textLength": 153,
        "chaptersCount": 0,
        "questionSectionsCount": 0,
        "editionNotes": ""
      },
      "الاجتماعيات": {
        "fileName": "كتاب_الاجتماعيات_الخامس_الابتدائي.json",
        "subject": "الاجتماعيات",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 104,
        "nonEmptyPages": 104,
        "textLength": 93727,
        "chaptersCount": 6,
        "questionSectionsCount": 0,
        "editionNotes": ""
      },
      "الرياضيات [كتاب النشاط / التمرينات]": {
        "fileName": "كتاب_الرياضيات_التمرينات_الخامس_الابتدائي.json",
        "subject": "الرياضيات",
        "part": "كامل",
        "bookType": "كتاب النشاط / التمرينات",
        "totalPages": 54,
        "nonEmptyPages": 54,
        "textLength": 29908,
        "chaptersCount": 0,
        "questionSectionsCount": 0,
        "editionNotes": ""
      },
      "العلوم [كتاب النشاط / التمرينات]": {
        "fileName": "كتاب_العلوم_النشاط_الخامس_الابتدائي.json",
        "subject": "العلوم",
        "part": "كامل",
        "bookType": "كتاب النشاط / التمرينات",
        "totalPages": 92,
        "nonEmptyPages": 90,
        "textLength": 97111,
        "chaptersCount": 1,
        "questionSectionsCount": 0,
        "editionNotes": ""
      }
    },
    "الرابع الابتدائي": {
      "التربية الإسلامية": {
        "fileName": "كتاب الاسلامية الرابع الابتدائي.json",
        "subject": "التربية الإسلامية",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 72,
        "nonEmptyPages": 53,
        "textLength": 51849,
        "chaptersCount": 3,
        "questionSectionsCount": 0,
        "editionNotes": ""
      },
      "الرياضيات": {
        "fileName": "كتاب الرياضيات الرابع الابتدائي.json",
        "subject": "الرياضيات",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 196,
        "nonEmptyPages": 195,
        "textLength": 170591,
        "chaptersCount": 0,
        "questionSectionsCount": 0,
        "editionNotes": ""
      },
      "العلوم": {
        "fileName": "كتاب العلوم الرابع الابتدائي.json",
        "subject": "العلوم",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 216,
        "nonEmptyPages": 216,
        "textLength": 250256,
        "chaptersCount": 0,
        "questionSectionsCount": 0,
        "editionNotes": ""
      },
      "قواعد اللغة العربية": {
        "fileName": "كتاب القواعد الرابع الابتدائي.json",
        "subject": "قواعد اللغة العربية",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 80,
        "nonEmptyPages": 8,
        "textLength": 606,
        "chaptersCount": 0,
        "questionSectionsCount": 0,
        "editionNotes": ""
      },
      "الاجتماعيات": {
        "fileName": "كتاب_الاجتماعيات_الرابع_الابتدائي.json",
        "subject": "الاجتماعيات",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 64,
        "nonEmptyPages": 20,
        "textLength": 10601,
        "chaptersCount": 0,
        "questionSectionsCount": 0,
        "editionNotes": ""
      },
      "الرياضيات [كتاب النشاط / التمرينات]": {
        "fileName": "كتاب_تمرينات_الرياضيات_الرابع_الابتدائي.json",
        "subject": "الرياضيات",
        "part": "كامل",
        "bookType": "كتاب النشاط / التمرينات",
        "totalPages": 56,
        "nonEmptyPages": 53,
        "textLength": 36147,
        "chaptersCount": 0,
        "questionSectionsCount": 0,
        "editionNotes": ""
      },
      "العلوم [كتاب النشاط / التمرينات]": {
        "fileName": "كتاب_نشاط_العلوم_الرابع_الابتدائي.json",
        "subject": "العلوم",
        "part": "كامل",
        "bookType": "كتاب النشاط / التمرينات",
        "totalPages": 100,
        "nonEmptyPages": 100,
        "textLength": 105409,
        "chaptersCount": 1,
        "questionSectionsCount": 0,
        "editionNotes": ""
      }
    },
    "السادس الابتدائي": {
      "التربية الإسلامية": {
        "fileName": "كتاب الاسلامية السادس الابتدائي.json",
        "subject": "التربية الإسلامية",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 92,
        "nonEmptyPages": 91,
        "textLength": 89852,
        "chaptersCount": 3,
        "questionSectionsCount": 0,
        "editionNotes": ""
      },
      "الرياضيات": {
        "fileName": "كتاب الرياضيات السادس الابتدائي.json",
        "subject": "الرياضيات",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 200,
        "nonEmptyPages": 198,
        "textLength": 155496,
        "chaptersCount": 0,
        "questionSectionsCount": 0,
        "editionNotes": ""
      },
      "العلوم": {
        "fileName": "كتاب العلوم السادس الابتدائي.json",
        "subject": "العلوم",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 208,
        "nonEmptyPages": 208,
        "textLength": 273642,
        "chaptersCount": 0,
        "questionSectionsCount": 0,
        "editionNotes": ""
      },
      "القراءة العربية": {
        "fileName": "كتاب القراءة السادس الابتدائي.json",
        "subject": "القراءة العربية",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 142,
        "nonEmptyPages": 15,
        "textLength": 550,
        "chaptersCount": 0,
        "questionSectionsCount": 0,
        "editionNotes": ""
      },
      "قواعد اللغة العربية": {
        "fileName": "كتاب القواعد السادس الابتدائي.json",
        "subject": "قواعد اللغة العربية",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 108,
        "nonEmptyPages": 3,
        "textLength": 199,
        "chaptersCount": 0,
        "questionSectionsCount": 0,
        "editionNotes": ""
      },
      "الاجتماعيات": {
        "fileName": "كتاب_الاجتماعيات_السادس_الابتدائي.json",
        "subject": "الاجتماعيات",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 116,
        "nonEmptyPages": 116,
        "textLength": 109637,
        "chaptersCount": 0,
        "questionSectionsCount": 0,
        "editionNotes": ""
      },
      "اللغة الإنجليزية": {
        "fileName": "كتاب_الطالب_اربع_وحدات_سادس_ابتدائي_المنهج_الحديث.json",
        "subject": "اللغة الإنجليزية",
        "part": "كامل",
        "bookType": "كتاب الطالب",
        "totalPages": 52,
        "nonEmptyPages": 52,
        "textLength": 44607,
        "chaptersCount": 0,
        "questionSectionsCount": 0,
        "editionNotes": "المنهج الجديد"
      },
      "اللغة الإنجليزية [كتاب النشاط / التمرينات]": {
        "fileName": "كتاب_النشاط_اربع_وحدات_سادس_ابتدائي_المنهج_الحديث.json",
        "subject": "اللغة الإنجليزية",
        "part": "كامل",
        "bookType": "كتاب النشاط / التمرينات",
        "totalPages": 52,
        "nonEmptyPages": 52,
        "textLength": 49063,
        "chaptersCount": 0,
        "questionSectionsCount": 0,
        "editionNotes": "المنهج الجديد"
      },
      "الرياضيات [كتاب النشاط / التمرينات]": {
        "fileName": "كتاب_تمرينات_الرياضيات_السادس_الابتدائي.json",
        "subject": "الرياضيات",
        "part": "كامل",
        "bookType": "كتاب النشاط / التمرينات",
        "totalPages": 58,
        "nonEmptyPages": 58,
        "textLength": 36621,
        "chaptersCount": 0,
        "questionSectionsCount": 0,
        "editionNotes": ""
      },
      "العلوم [كتاب النشاط / التمرينات]": {
        "fileName": "كتاب_نشاط_العلوم_السادس_الابتدائي.json",
        "subject": "العلوم",
        "part": "كامل",
        "bookType": "كتاب النشاط / التمرينات",
        "totalPages": 92,
        "nonEmptyPages": 92,
        "textLength": 98169,
        "chaptersCount": 4,
        "questionSectionsCount": 0,
        "editionNotes": ""
      }
    }
  }
};

/** قائمة الكتب المعتمدة */
export const CANONICAL_BOOKS_COUNT = 95;
export const TOTAL_PAGES_COUNT = 13294;
export const TOTAL_CHARS_COUNT = 12887586;
