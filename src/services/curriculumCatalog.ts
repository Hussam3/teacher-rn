/**
 * الكتالوج الموحد للمناهج والكتب وروابط الـ PDF والفصول.
 * توليد آلي من فهرس المناهج وروابط التحميل.
 * إجمالي الكتب: 124
 */

export interface CurriculumBook {
  id: string;
  title: string;
  subjectName: string;
  typeOrPart: string;
  stage: 'المرحلة الابتدائية' | 'المرحلة المتوسطة' | 'المرحلة الإعدادية';
  grade: string;
  fileName: string;
  driveId: string;
  viewUrl: string;
  downloadUrl: string;
  hasPdf: boolean;
}

export const STAGES_LIST = [
  'المرحلة الابتدائية',
  'المرحلة المتوسطة',
  'المرحلة الإعدادية',
] as const;

export type StageName = (typeof STAGES_LIST)[number];

export const GRADES_BY_STAGE: Record<StageName, string[]> = {
  'المرحلة الابتدائية': [
    'الأول الابتدائي',
    'الثاني الابتدائي',
    'الثالث الابتدائي',
    'الرابع الابتدائي',
    'الخامس الابتدائي',
    'السادس الابتدائي',
  ],
  'المرحلة المتوسطة': [
    'الأول المتوسط',
    'الثاني المتوسط',
    'الثالث المتوسط',
  ],
  'المرحلة الإعدادية': [
    'الرابع الإعدادي',
    'الخامس الإعدادي',
    'السادس الإعدادي',
  ],
};

export const ALL_CURRICULUM_BOOKS: CurriculumBook[] = [
  {
    "id": "pdf_1QgvRRuBtcbNcC5rfmYlyuSZPGxY3qifp",
    "title": "الاجتماعيات",
    "subjectName": "الاجتماعيات",
    "typeOrPart": "",
    "stage": "المرحلة الابتدائية",
    "grade": "الخامس الابتدائي",
    "fileName": "كتاب_الاجتماعيات_الخامس_الابتدائي.pdf",
    "driveId": "1QgvRRuBtcbNcC5rfmYlyuSZPGxY3qifp",
    "viewUrl": "https://drive.google.com/file/d/1QgvRRuBtcbNcC5rfmYlyuSZPGxY3qifp/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1QgvRRuBtcbNcC5rfmYlyuSZPGxY3qifp",
    "hasPdf": true
  },
  {
    "id": "pdf_1GPZTILrAe4Gkk3guZQjFGYf98B7MaCtI",
    "title": "التربية الإسلامية",
    "subjectName": "التربية الإسلامية",
    "typeOrPart": "",
    "stage": "المرحلة الابتدائية",
    "grade": "الخامس الابتدائي",
    "fileName": "كتاب الاسلامية الخامس الابتدائي.pdf",
    "driveId": "1GPZTILrAe4Gkk3guZQjFGYf98B7MaCtI",
    "viewUrl": "https://drive.google.com/file/d/1GPZTILrAe4Gkk3guZQjFGYf98B7MaCtI/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1GPZTILrAe4Gkk3guZQjFGYf98B7MaCtI",
    "hasPdf": true
  },
  {
    "id": "pdf_1-F3KiprpPfsFK11BtZ9llvjABGEMT9sg",
    "title": "الرياضيات",
    "subjectName": "الرياضيات",
    "typeOrPart": "",
    "stage": "المرحلة الابتدائية",
    "grade": "الخامس الابتدائي",
    "fileName": "كتاب الرياضيات الخامس الابتدائي.pdf",
    "driveId": "1-F3KiprpPfsFK11BtZ9llvjABGEMT9sg",
    "viewUrl": "https://drive.google.com/file/d/1-F3KiprpPfsFK11BtZ9llvjABGEMT9sg/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1-F3KiprpPfsFK11BtZ9llvjABGEMT9sg",
    "hasPdf": true
  },
  {
    "id": "pdf_1WvVHbTlf0GRD8MNuaXQG5RN-0GwmDfBn",
    "title": "الرياضيات",
    "subjectName": "الرياضيات",
    "typeOrPart": "",
    "stage": "المرحلة الابتدائية",
    "grade": "الخامس الابتدائي",
    "fileName": "كتاب_الرياضيات_التمرينات_الخامس_الابتدائي.pdf",
    "driveId": "1WvVHbTlf0GRD8MNuaXQG5RN-0GwmDfBn",
    "viewUrl": "https://drive.google.com/file/d/1WvVHbTlf0GRD8MNuaXQG5RN-0GwmDfBn/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1WvVHbTlf0GRD8MNuaXQG5RN-0GwmDfBn",
    "hasPdf": true
  },
  {
    "id": "pdf_1WAPXCPqGBJ2cWtUynB6iDWByDrfLm3vX",
    "title": "العلوم",
    "subjectName": "العلوم",
    "typeOrPart": "",
    "stage": "المرحلة الابتدائية",
    "grade": "الخامس الابتدائي",
    "fileName": "كتاب العلوم الخامس الابتدائي.pdf",
    "driveId": "1WAPXCPqGBJ2cWtUynB6iDWByDrfLm3vX",
    "viewUrl": "https://drive.google.com/file/d/1WAPXCPqGBJ2cWtUynB6iDWByDrfLm3vX/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1WAPXCPqGBJ2cWtUynB6iDWByDrfLm3vX",
    "hasPdf": true
  },
  {
    "id": "pdf_1UlCpFOIRwavl3s1Ds5eU_DI8Z6aQKfH8",
    "title": "العلوم (كتاب النشاط)",
    "subjectName": "العلوم",
    "typeOrPart": "كتاب النشاط",
    "stage": "المرحلة الابتدائية",
    "grade": "الخامس الابتدائي",
    "fileName": "كتاب_العلوم_النشاط_الخامس_الابتدائي.pdf",
    "driveId": "1UlCpFOIRwavl3s1Ds5eU_DI8Z6aQKfH8",
    "viewUrl": "https://drive.google.com/file/d/1UlCpFOIRwavl3s1Ds5eU_DI8Z6aQKfH8/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1UlCpFOIRwavl3s1Ds5eU_DI8Z6aQKfH8",
    "hasPdf": true
  },
  {
    "id": "pdf_19sQIRpC5YjIXSeqZuntttSh4sPspsmcd",
    "title": "القراءة",
    "subjectName": "القراءة",
    "typeOrPart": "",
    "stage": "المرحلة الابتدائية",
    "grade": "الخامس الابتدائي",
    "fileName": "كتاب القراءة الخامس الابتدائي.pdf",
    "driveId": "19sQIRpC5YjIXSeqZuntttSh4sPspsmcd",
    "viewUrl": "https://drive.google.com/file/d/19sQIRpC5YjIXSeqZuntttSh4sPspsmcd/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=19sQIRpC5YjIXSeqZuntttSh4sPspsmcd",
    "hasPdf": true
  },
  {
    "id": "pdf_1fIDxBvAmfcIcEPuk7aKicQ0ktKJrFCq-",
    "title": "القواعد",
    "subjectName": "القواعد",
    "typeOrPart": "",
    "stage": "المرحلة الابتدائية",
    "grade": "الخامس الابتدائي",
    "fileName": "كتاب القواعد الخامس الابتدائي.pdf",
    "driveId": "1fIDxBvAmfcIcEPuk7aKicQ0ktKJrFCq-",
    "viewUrl": "https://drive.google.com/file/d/1fIDxBvAmfcIcEPuk7aKicQ0ktKJrFCq-/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1fIDxBvAmfcIcEPuk7aKicQ0ktKJrFCq-",
    "hasPdf": true
  },
  {
    "id": "pdf_1z-M4fxmzIG4sYBwzC1jiatrz_plFBsrF",
    "title": "اللغة الإنجليزية (كتاب الطالب)",
    "subjectName": "اللغة الإنجليزية",
    "typeOrPart": "كتاب الطالب",
    "stage": "المرحلة الابتدائية",
    "grade": "الخامس الابتدائي",
    "fileName": "كتاب_الانكليزي_الطالب_الصف_الخامس_الابتدائي.pdf",
    "driveId": "1z-M4fxmzIG4sYBwzC1jiatrz_plFBsrF",
    "viewUrl": "https://drive.google.com/file/d/1z-M4fxmzIG4sYBwzC1jiatrz_plFBsrF/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1z-M4fxmzIG4sYBwzC1jiatrz_plFBsrF",
    "hasPdf": true
  },
  {
    "id": "pdf_1z9FfY1ycAKz-4CbqEk3sdf6lknSdxr3p",
    "title": "اللغة الإنجليزية (كتاب النشاط)",
    "subjectName": "اللغة الإنجليزية",
    "typeOrPart": "كتاب النشاط",
    "stage": "المرحلة الابتدائية",
    "grade": "الخامس الابتدائي",
    "fileName": "كتاب_الانكليزي_النشاط_الصف_الخامس_الابتدائي.pdf",
    "driveId": "1z9FfY1ycAKz-4CbqEk3sdf6lknSdxr3p",
    "viewUrl": "https://drive.google.com/file/d/1z9FfY1ycAKz-4CbqEk3sdf6lknSdxr3p/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1z9FfY1ycAKz-4CbqEk3sdf6lknSdxr3p",
    "hasPdf": true
  },
  {
    "id": "pdf_16pH_ip2_k7gT-lIEHAU_aW3VDUq3hltW",
    "title": "الاجتماعيات",
    "subjectName": "الاجتماعيات",
    "typeOrPart": "",
    "stage": "المرحلة الابتدائية",
    "grade": "الرابع الابتدائي",
    "fileName": "كتاب_الاجتماعيات_الرابع_الابتدائي.pdf",
    "driveId": "16pH_ip2_k7gT-lIEHAU_aW3VDUq3hltW",
    "viewUrl": "https://drive.google.com/file/d/16pH_ip2_k7gT-lIEHAU_aW3VDUq3hltW/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=16pH_ip2_k7gT-lIEHAU_aW3VDUq3hltW",
    "hasPdf": true
  },
  {
    "id": "pdf_16jHS_GRMPXzdow2SSmQ5XCVkki4kQIbW",
    "title": "التربية الإسلامية",
    "subjectName": "التربية الإسلامية",
    "typeOrPart": "",
    "stage": "المرحلة الابتدائية",
    "grade": "الرابع الابتدائي",
    "fileName": "كتاب الاسلامية الرابع الابتدائي.pdf",
    "driveId": "16jHS_GRMPXzdow2SSmQ5XCVkki4kQIbW",
    "viewUrl": "https://drive.google.com/file/d/16jHS_GRMPXzdow2SSmQ5XCVkki4kQIbW/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=16jHS_GRMPXzdow2SSmQ5XCVkki4kQIbW",
    "hasPdf": true
  },
  {
    "id": "pdf_1SPAhK8cyoUgBb4EHn04QW7gCoiNtRD-1",
    "title": "الرياضيات",
    "subjectName": "الرياضيات",
    "typeOrPart": "",
    "stage": "المرحلة الابتدائية",
    "grade": "الرابع الابتدائي",
    "fileName": "كتاب الرياضيات الرابع الابتدائي.pdf",
    "driveId": "1SPAhK8cyoUgBb4EHn04QW7gCoiNtRD-1",
    "viewUrl": "https://drive.google.com/file/d/1SPAhK8cyoUgBb4EHn04QW7gCoiNtRD-1/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1SPAhK8cyoUgBb4EHn04QW7gCoiNtRD-1",
    "hasPdf": true
  },
  {
    "id": "pdf_1sLZa0fO75h7oEup_6DKEN5-DPFjeB_xZ",
    "title": "الرياضيات",
    "subjectName": "الرياضيات",
    "typeOrPart": "",
    "stage": "المرحلة الابتدائية",
    "grade": "الرابع الابتدائي",
    "fileName": "كتاب_تمرينات_الرياضيات_الرابع_الابتدائي.pdf",
    "driveId": "1sLZa0fO75h7oEup_6DKEN5-DPFjeB_xZ",
    "viewUrl": "https://drive.google.com/file/d/1sLZa0fO75h7oEup_6DKEN5-DPFjeB_xZ/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1sLZa0fO75h7oEup_6DKEN5-DPFjeB_xZ",
    "hasPdf": true
  },
  {
    "id": "pdf_1lcCWIUSltJJJmk6tdEEknuJk1SmTGCAS",
    "title": "العلوم",
    "subjectName": "العلوم",
    "typeOrPart": "",
    "stage": "المرحلة الابتدائية",
    "grade": "الرابع الابتدائي",
    "fileName": "كتاب العلوم الرابع الابتدائي.pdf",
    "driveId": "1lcCWIUSltJJJmk6tdEEknuJk1SmTGCAS",
    "viewUrl": "https://drive.google.com/file/d/1lcCWIUSltJJJmk6tdEEknuJk1SmTGCAS/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1lcCWIUSltJJJmk6tdEEknuJk1SmTGCAS",
    "hasPdf": true
  },
  {
    "id": "pdf_1neAeFVMtsvpoMmCbhTzfqZRzortNoSbq",
    "title": "العلوم",
    "subjectName": "العلوم",
    "typeOrPart": "",
    "stage": "المرحلة الابتدائية",
    "grade": "الرابع الابتدائي",
    "fileName": "كتاب_نشاط_العلوم_الرابع_الابتدائي.pdf",
    "driveId": "1neAeFVMtsvpoMmCbhTzfqZRzortNoSbq",
    "viewUrl": "https://drive.google.com/file/d/1neAeFVMtsvpoMmCbhTzfqZRzortNoSbq/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1neAeFVMtsvpoMmCbhTzfqZRzortNoSbq",
    "hasPdf": true
  },
  {
    "id": "pdf_1rVKy097Q5MZRyLoBObFHxUoaq6xYuRy4",
    "title": "القراءة",
    "subjectName": "القراءة",
    "typeOrPart": "",
    "stage": "المرحلة الابتدائية",
    "grade": "الرابع الابتدائي",
    "fileName": "كتاب القراءة الرابع الابتدائي.pdf",
    "driveId": "1rVKy097Q5MZRyLoBObFHxUoaq6xYuRy4",
    "viewUrl": "https://drive.google.com/file/d/1rVKy097Q5MZRyLoBObFHxUoaq6xYuRy4/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1rVKy097Q5MZRyLoBObFHxUoaq6xYuRy4",
    "hasPdf": true
  },
  {
    "id": "pdf_17kQx6AiAhhQDcI9yz2-Yg3-NFd_cRlq4",
    "title": "القواعد",
    "subjectName": "القواعد",
    "typeOrPart": "",
    "stage": "المرحلة الابتدائية",
    "grade": "الرابع الابتدائي",
    "fileName": "كتاب القواعد الرابع الابتدائي.pdf",
    "driveId": "17kQx6AiAhhQDcI9yz2-Yg3-NFd_cRlq4",
    "viewUrl": "https://drive.google.com/file/d/17kQx6AiAhhQDcI9yz2-Yg3-NFd_cRlq4/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=17kQx6AiAhhQDcI9yz2-Yg3-NFd_cRlq4",
    "hasPdf": true
  },
  {
    "id": "pdf_1dzFvmI63aMzofGs4MM85KZX4x6sL-qEy",
    "title": "اللغة الإنجليزية (كتاب الطالب)",
    "subjectName": "اللغة الإنجليزية",
    "typeOrPart": "كتاب الطالب",
    "stage": "المرحلة الابتدائية",
    "grade": "الرابع الابتدائي",
    "fileName": "كتاب_الانكليزي_الطالب_الصف_الرابع_الابتدائي.pdf",
    "driveId": "1dzFvmI63aMzofGs4MM85KZX4x6sL-qEy",
    "viewUrl": "https://drive.google.com/file/d/1dzFvmI63aMzofGs4MM85KZX4x6sL-qEy/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1dzFvmI63aMzofGs4MM85KZX4x6sL-qEy",
    "hasPdf": true
  },
  {
    "id": "pdf_1pi6oRiUGEb4suwCaIcfh409LUIHoHghT",
    "title": "اللغة الإنجليزية (كتاب النشاط)",
    "subjectName": "اللغة الإنجليزية",
    "typeOrPart": "كتاب النشاط",
    "stage": "المرحلة الابتدائية",
    "grade": "الرابع الابتدائي",
    "fileName": "كتاب_الانكليزي_النشاط_الصف_الرابع_الابتدائي.pdf",
    "driveId": "1pi6oRiUGEb4suwCaIcfh409LUIHoHghT",
    "viewUrl": "https://drive.google.com/file/d/1pi6oRiUGEb4suwCaIcfh409LUIHoHghT/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1pi6oRiUGEb4suwCaIcfh409LUIHoHghT",
    "hasPdf": true
  },
  {
    "id": "pdf_1HPLIpC-mgCoxpF1WCnKFU4oigEfG1LxC",
    "title": "الاجتماعيات",
    "subjectName": "الاجتماعيات",
    "typeOrPart": "",
    "stage": "المرحلة الابتدائية",
    "grade": "السادس الابتدائي",
    "fileName": "كتاب_الاجتماعيات_السادس_الابتدائي.pdf",
    "driveId": "1HPLIpC-mgCoxpF1WCnKFU4oigEfG1LxC",
    "viewUrl": "https://drive.google.com/file/d/1HPLIpC-mgCoxpF1WCnKFU4oigEfG1LxC/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1HPLIpC-mgCoxpF1WCnKFU4oigEfG1LxC",
    "hasPdf": true
  },
  {
    "id": "pdf_1wV5GJjgRBcMi4Bk2ec4qjpE4Dq9-U-g1",
    "title": "التربية الإسلامية",
    "subjectName": "التربية الإسلامية",
    "typeOrPart": "",
    "stage": "المرحلة الابتدائية",
    "grade": "السادس الابتدائي",
    "fileName": "كتاب الاسلامية السادس الابتدائي.pdf",
    "driveId": "1wV5GJjgRBcMi4Bk2ec4qjpE4Dq9-U-g1",
    "viewUrl": "https://drive.google.com/file/d/1wV5GJjgRBcMi4Bk2ec4qjpE4Dq9-U-g1/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1wV5GJjgRBcMi4Bk2ec4qjpE4Dq9-U-g1",
    "hasPdf": true
  },
  {
    "id": "pdf_1XdlOGGza2fig2mvRo41JsUHjYKs8IZP5",
    "title": "الرياضيات",
    "subjectName": "الرياضيات",
    "typeOrPart": "",
    "stage": "المرحلة الابتدائية",
    "grade": "السادس الابتدائي",
    "fileName": "كتاب الرياضيات السادس الابتدائي.pdf",
    "driveId": "1XdlOGGza2fig2mvRo41JsUHjYKs8IZP5",
    "viewUrl": "https://drive.google.com/file/d/1XdlOGGza2fig2mvRo41JsUHjYKs8IZP5/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1XdlOGGza2fig2mvRo41JsUHjYKs8IZP5",
    "hasPdf": true
  },
  {
    "id": "pdf_1b3UvcW2rzJDH0JJGut-NxEpNBiHQOvCl",
    "title": "الرياضيات",
    "subjectName": "الرياضيات",
    "typeOrPart": "",
    "stage": "المرحلة الابتدائية",
    "grade": "السادس الابتدائي",
    "fileName": "كتاب_تمرينات_الرياضيات_السادس_الابتدائي.pdf",
    "driveId": "1b3UvcW2rzJDH0JJGut-NxEpNBiHQOvCl",
    "viewUrl": "https://drive.google.com/file/d/1b3UvcW2rzJDH0JJGut-NxEpNBiHQOvCl/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1b3UvcW2rzJDH0JJGut-NxEpNBiHQOvCl",
    "hasPdf": true
  },
  {
    "id": "pdf_1S9C_aDFk-zkzsIj4Ql7UAbeYxUOoY0d0",
    "title": "العلوم",
    "subjectName": "العلوم",
    "typeOrPart": "",
    "stage": "المرحلة الابتدائية",
    "grade": "السادس الابتدائي",
    "fileName": "كتاب العلوم السادس الابتدائي.pdf",
    "driveId": "1S9C_aDFk-zkzsIj4Ql7UAbeYxUOoY0d0",
    "viewUrl": "https://drive.google.com/file/d/1S9C_aDFk-zkzsIj4Ql7UAbeYxUOoY0d0/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1S9C_aDFk-zkzsIj4Ql7UAbeYxUOoY0d0",
    "hasPdf": true
  },
  {
    "id": "pdf_1ATJg9xwOF4fLhIzPS-tDg4WMPkpuRbxY",
    "title": "العلوم",
    "subjectName": "العلوم",
    "typeOrPart": "",
    "stage": "المرحلة الابتدائية",
    "grade": "السادس الابتدائي",
    "fileName": "كتاب_نشاط_العلوم_السادس_الابتدائي.pdf",
    "driveId": "1ATJg9xwOF4fLhIzPS-tDg4WMPkpuRbxY",
    "viewUrl": "https://drive.google.com/file/d/1ATJg9xwOF4fLhIzPS-tDg4WMPkpuRbxY/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1ATJg9xwOF4fLhIzPS-tDg4WMPkpuRbxY",
    "hasPdf": true
  },
  {
    "id": "pdf_1vADhSRPJRJaBv3MwdkYnWaW6nU4tKn23",
    "title": "القراءة",
    "subjectName": "القراءة",
    "typeOrPart": "",
    "stage": "المرحلة الابتدائية",
    "grade": "السادس الابتدائي",
    "fileName": "كتاب القراءة السادس الابتدائي.pdf",
    "driveId": "1vADhSRPJRJaBv3MwdkYnWaW6nU4tKn23",
    "viewUrl": "https://drive.google.com/file/d/1vADhSRPJRJaBv3MwdkYnWaW6nU4tKn23/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1vADhSRPJRJaBv3MwdkYnWaW6nU4tKn23",
    "hasPdf": true
  },
  {
    "id": "pdf_1ERFua7a0T08uo1-uFsvcT7VEvr8a0x4N",
    "title": "القواعد",
    "subjectName": "القواعد",
    "typeOrPart": "",
    "stage": "المرحلة الابتدائية",
    "grade": "السادس الابتدائي",
    "fileName": "كتاب القواعد السادس الابتدائي.pdf",
    "driveId": "1ERFua7a0T08uo1-uFsvcT7VEvr8a0x4N",
    "viewUrl": "https://drive.google.com/file/d/1ERFua7a0T08uo1-uFsvcT7VEvr8a0x4N/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1ERFua7a0T08uo1-uFsvcT7VEvr8a0x4N",
    "hasPdf": true
  },
  {
    "id": "pdf_1rEP4J6EQC-DsYQwj2p7rHrbsU0jXBrgp",
    "title": "غير محددة (كتاب الطالب)",
    "subjectName": "غير محددة",
    "typeOrPart": "كتاب الطالب",
    "stage": "المرحلة الابتدائية",
    "grade": "الخامس الابتدائي",
    "fileName": "كتاب_الطالب_اربع_وحدات_سادس_ابتدائي_المنهج_الحديث.pdf",
    "driveId": "1rEP4J6EQC-DsYQwj2p7rHrbsU0jXBrgp",
    "viewUrl": "https://drive.google.com/file/d/1rEP4J6EQC-DsYQwj2p7rHrbsU0jXBrgp/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1rEP4J6EQC-DsYQwj2p7rHrbsU0jXBrgp",
    "hasPdf": true
  },
  {
    "id": "pdf_1LP1NKK_BQJxYg-OEJPpO_XL1ZmzkEmBM",
    "title": "غير محددة (كتاب النشاط)",
    "subjectName": "غير محددة",
    "typeOrPart": "كتاب النشاط",
    "stage": "المرحلة الابتدائية",
    "grade": "الخامس الابتدائي",
    "fileName": "كتاب_النشاط_اربع_وحدات_سادس_ابتدائي_المنهج_الحديث.pdf",
    "driveId": "1LP1NKK_BQJxYg-OEJPpO_XL1ZmzkEmBM",
    "viewUrl": "https://drive.google.com/file/d/1LP1NKK_BQJxYg-OEJPpO_XL1ZmzkEmBM/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1LP1NKK_BQJxYg-OEJPpO_XL1ZmzkEmBM",
    "hasPdf": true
  },
  {
    "id": "pdf_1-ACuATI6i5LVf9orfyFKeu7-0ab7dlDn",
    "title": "الأحياء",
    "subjectName": "الأحياء",
    "typeOrPart": "",
    "stage": "المرحلة الإعدادية",
    "grade": "الرابع الإعدادي",
    "fileName": "كتاب_الاحياء_المؤشر_سالم_ال_منصور_السادس_العلمي_2025_الفصل_الاول.pdf",
    "driveId": "1-ACuATI6i5LVf9orfyFKeu7-0ab7dlDn",
    "viewUrl": "https://drive.google.com/file/d/1-ACuATI6i5LVf9orfyFKeu7-0ab7dlDn/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1-ACuATI6i5LVf9orfyFKeu7-0ab7dlDn",
    "hasPdf": true
  },
  {
    "id": "pdf_1BqmwE7ubZ1N8Sji5ts9_iWMSnPQQ0vQM",
    "title": "اللغة العربية (الجزء الأول - نسخة 2)",
    "subjectName": "اللغة العربية",
    "typeOrPart": "الجزء الأول - نسخة 2",
    "stage": "المرحلة الإعدادية",
    "grade": "الرابع الإعدادي",
    "fileName": "كتاب_العربي_الخامس_الاعدادي_الجزء_الاول (2).pdf",
    "driveId": "1BqmwE7ubZ1N8Sji5ts9_iWMSnPQQ0vQM",
    "viewUrl": "https://drive.google.com/file/d/1BqmwE7ubZ1N8Sji5ts9_iWMSnPQQ0vQM/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1BqmwE7ubZ1N8Sji5ts9_iWMSnPQQ0vQM",
    "hasPdf": true
  },
  {
    "id": "pdf_1qp0ermqHxVL2O12YUlStEDJRsimd6I8v",
    "title": "اللغة العربية (الجزء الأول)",
    "subjectName": "اللغة العربية",
    "typeOrPart": "الجزء الأول",
    "stage": "المرحلة الإعدادية",
    "grade": "الرابع الإعدادي",
    "fileName": "كتاب_العربي_الخامس_الاعدادي_الجزء_الاول.pdf",
    "driveId": "1qp0ermqHxVL2O12YUlStEDJRsimd6I8v",
    "viewUrl": "https://drive.google.com/file/d/1qp0ermqHxVL2O12YUlStEDJRsimd6I8v/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1qp0ermqHxVL2O12YUlStEDJRsimd6I8v",
    "hasPdf": true
  },
  {
    "id": "pdf_1p8c6_su9fsSLHcu_52FWFP8GKMcwCez8",
    "title": "اللغة العربية (الجزء الأول)",
    "subjectName": "اللغة العربية",
    "typeOrPart": "الجزء الأول",
    "stage": "المرحلة الإعدادية",
    "grade": "الرابع الإعدادي",
    "fileName": "كتاب_العربي_الرابع_الاعدادي_الجزء_الاول.pdf",
    "driveId": "1p8c6_su9fsSLHcu_52FWFP8GKMcwCez8",
    "viewUrl": "https://drive.google.com/file/d/1p8c6_su9fsSLHcu_52FWFP8GKMcwCez8/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1p8c6_su9fsSLHcu_52FWFP8GKMcwCez8",
    "hasPdf": true
  },
  {
    "id": "pdf_1nXsYuFlP6T39_phOPia6I3edzHe2Worx",
    "title": "اللغة العربية (الجزء الأول - نسخة 2)",
    "subjectName": "اللغة العربية",
    "typeOrPart": "الجزء الأول - نسخة 2",
    "stage": "المرحلة الإعدادية",
    "grade": "الرابع الإعدادي",
    "fileName": "كتاب_العربي_السادس_الاعدادي_الجزء_الاول (2).pdf",
    "driveId": "1nXsYuFlP6T39_phOPia6I3edzHe2Worx",
    "viewUrl": "https://drive.google.com/file/d/1nXsYuFlP6T39_phOPia6I3edzHe2Worx/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1nXsYuFlP6T39_phOPia6I3edzHe2Worx",
    "hasPdf": true
  },
  {
    "id": "pdf_1tRM74d4NPCBnioEGvXbyiaYsR0WATFLH",
    "title": "اللغة العربية (الجزء الأول)",
    "subjectName": "اللغة العربية",
    "typeOrPart": "الجزء الأول",
    "stage": "المرحلة الإعدادية",
    "grade": "الرابع الإعدادي",
    "fileName": "كتاب_العربي_السادس_الاعدادي_الجزء_الاول.pdf",
    "driveId": "1tRM74d4NPCBnioEGvXbyiaYsR0WATFLH",
    "viewUrl": "https://drive.google.com/file/d/1tRM74d4NPCBnioEGvXbyiaYsR0WATFLH/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1tRM74d4NPCBnioEGvXbyiaYsR0WATFLH",
    "hasPdf": true
  },
  {
    "id": "pdf_1L5AJdt9CZCzqE_xZqMuuszyezq-FAEK1",
    "title": "اللغة العربية (الجزء الثاني - نسخة 2)",
    "subjectName": "اللغة العربية",
    "typeOrPart": "الجزء الثاني - نسخة 2",
    "stage": "المرحلة الإعدادية",
    "grade": "الخامس الإعدادي",
    "fileName": "كتاب_العربي_الخامس_الاعدادي_الجزء_الثاني (2).pdf",
    "driveId": "1L5AJdt9CZCzqE_xZqMuuszyezq-FAEK1",
    "viewUrl": "https://drive.google.com/file/d/1L5AJdt9CZCzqE_xZqMuuszyezq-FAEK1/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1L5AJdt9CZCzqE_xZqMuuszyezq-FAEK1",
    "hasPdf": true
  },
  {
    "id": "pdf_1yOpcKFexEXqWXcpqCobz7AcBrut1L5_E",
    "title": "اللغة العربية (الجزء الثاني)",
    "subjectName": "اللغة العربية",
    "typeOrPart": "الجزء الثاني",
    "stage": "المرحلة الإعدادية",
    "grade": "الخامس الإعدادي",
    "fileName": "كتاب_العربي_الخامس_الاعدادي_الجزء_الثاني.pdf",
    "driveId": "1yOpcKFexEXqWXcpqCobz7AcBrut1L5_E",
    "viewUrl": "https://drive.google.com/file/d/1yOpcKFexEXqWXcpqCobz7AcBrut1L5_E/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1yOpcKFexEXqWXcpqCobz7AcBrut1L5_E",
    "hasPdf": true
  },
  {
    "id": "pdf_1nqWhQRxF2IO9sEkYxQ4D2TKgoocijCOR",
    "title": "اللغة العربية (الجزء الثاني)",
    "subjectName": "اللغة العربية",
    "typeOrPart": "الجزء الثاني",
    "stage": "المرحلة الإعدادية",
    "grade": "الخامس الإعدادي",
    "fileName": "كتاب_العربي_الرابع_الاعدادي_الجزء_الثاني.pdf",
    "driveId": "1nqWhQRxF2IO9sEkYxQ4D2TKgoocijCOR",
    "viewUrl": "https://drive.google.com/file/d/1nqWhQRxF2IO9sEkYxQ4D2TKgoocijCOR/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1nqWhQRxF2IO9sEkYxQ4D2TKgoocijCOR",
    "hasPdf": true
  },
  {
    "id": "pdf_142SasnrbI2GXHlO94Ki-1awHAYMSYmEg",
    "title": "اللغة العربية (الجزء الثاني - نسخة 2)",
    "subjectName": "اللغة العربية",
    "typeOrPart": "الجزء الثاني - نسخة 2",
    "stage": "المرحلة الإعدادية",
    "grade": "الخامس الإعدادي",
    "fileName": "كتاب_العربي_السادس_الاعدادي_الجزء_الثاني (2).pdf",
    "driveId": "142SasnrbI2GXHlO94Ki-1awHAYMSYmEg",
    "viewUrl": "https://drive.google.com/file/d/142SasnrbI2GXHlO94Ki-1awHAYMSYmEg/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=142SasnrbI2GXHlO94Ki-1awHAYMSYmEg",
    "hasPdf": true
  },
  {
    "id": "pdf_1TSrh5niShz9DVHXkSfBw0Mf1L0kbxX7V",
    "title": "اللغة العربية (الجزء الثاني)",
    "subjectName": "اللغة العربية",
    "typeOrPart": "الجزء الثاني",
    "stage": "المرحلة الإعدادية",
    "grade": "الخامس الإعدادي",
    "fileName": "كتاب_العربي_السادس_الاعدادي_الجزء_الثاني.pdf",
    "driveId": "1TSrh5niShz9DVHXkSfBw0Mf1L0kbxX7V",
    "viewUrl": "https://drive.google.com/file/d/1TSrh5niShz9DVHXkSfBw0Mf1L0kbxX7V/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1TSrh5niShz9DVHXkSfBw0Mf1L0kbxX7V",
    "hasPdf": true
  },
  {
    "id": "pdf_138CmHJP_1nr8KOCPiFmG5ziiJVA1u5AS",
    "title": "الأحياء",
    "subjectName": "الأحياء",
    "typeOrPart": "",
    "stage": "المرحلة الإعدادية",
    "grade": "الخامس الإعدادي",
    "fileName": "كتاب الاحياء الخامس الاعدادي.pdf",
    "driveId": "138CmHJP_1nr8KOCPiFmG5ziiJVA1u5AS",
    "viewUrl": "https://drive.google.com/file/d/138CmHJP_1nr8KOCPiFmG5ziiJVA1u5AS/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=138CmHJP_1nr8KOCPiFmG5ziiJVA1u5AS",
    "hasPdf": true
  },
  {
    "id": "pdf_17sVV5LdhNkgK5XVuZw4Diu3pGtYCUu80",
    "title": "التاريخ",
    "subjectName": "التاريخ",
    "typeOrPart": "",
    "stage": "المرحلة الإعدادية",
    "grade": "الخامس الإعدادي",
    "fileName": "كتاب التاريخ الخامس الادبي.pdf",
    "driveId": "17sVV5LdhNkgK5XVuZw4Diu3pGtYCUu80",
    "viewUrl": "https://drive.google.com/file/d/17sVV5LdhNkgK5XVuZw4Diu3pGtYCUu80/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=17sVV5LdhNkgK5XVuZw4Diu3pGtYCUu80",
    "hasPdf": true
  },
  {
    "id": "pdf_1F8AWC5Go8Bn4ka0ZgHivs6vELI9DaW3F",
    "title": "التربية الإسلامية (نسخة 2)",
    "subjectName": "التربية الإسلامية",
    "typeOrPart": "نسخة 2",
    "stage": "المرحلة الإعدادية",
    "grade": "الخامس الإعدادي",
    "fileName": "كتاب الاسلامية الخامس الاعدادي (2).pdf",
    "driveId": "1F8AWC5Go8Bn4ka0ZgHivs6vELI9DaW3F",
    "viewUrl": "https://drive.google.com/file/d/1F8AWC5Go8Bn4ka0ZgHivs6vELI9DaW3F/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1F8AWC5Go8Bn4ka0ZgHivs6vELI9DaW3F",
    "hasPdf": true
  },
  {
    "id": "pdf_18-K2yY5Yt3egcxw1WxNbtOfGGYUUerV4",
    "title": "التربية الإسلامية",
    "subjectName": "التربية الإسلامية",
    "typeOrPart": "",
    "stage": "المرحلة الإعدادية",
    "grade": "الخامس الإعدادي",
    "fileName": "كتاب الاسلامية الخامس الاعدادي.pdf",
    "driveId": "18-K2yY5Yt3egcxw1WxNbtOfGGYUUerV4",
    "viewUrl": "https://drive.google.com/file/d/18-K2yY5Yt3egcxw1WxNbtOfGGYUUerV4/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=18-K2yY5Yt3egcxw1WxNbtOfGGYUUerV4",
    "hasPdf": true
  },
  {
    "id": "pdf_1lK78oLVoWXUUBZNNzqi1VgkF8pZ6nT2W",
    "title": "الجغرافية",
    "subjectName": "الجغرافية",
    "typeOrPart": "",
    "stage": "المرحلة الإعدادية",
    "grade": "الخامس الإعدادي",
    "fileName": "كتاب الجغرافية الخامس الادبي.pdf",
    "driveId": "1lK78oLVoWXUUBZNNzqi1VgkF8pZ6nT2W",
    "viewUrl": "https://drive.google.com/file/d/1lK78oLVoWXUUBZNNzqi1VgkF8pZ6nT2W/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1lK78oLVoWXUUBZNNzqi1VgkF8pZ6nT2W",
    "hasPdf": true
  },
  {
    "id": "pdf_126VL4S66C_FboiOpYRbtYOyWk8CLvry4",
    "title": "الحاسوب (نسخة 2)",
    "subjectName": "الحاسوب",
    "typeOrPart": "نسخة 2",
    "stage": "المرحلة الإعدادية",
    "grade": "الخامس الإعدادي",
    "fileName": "كتاب الحاسوب الخامس الاعدادي (2).pdf",
    "driveId": "126VL4S66C_FboiOpYRbtYOyWk8CLvry4",
    "viewUrl": "https://drive.google.com/file/d/126VL4S66C_FboiOpYRbtYOyWk8CLvry4/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=126VL4S66C_FboiOpYRbtYOyWk8CLvry4",
    "hasPdf": true
  },
  {
    "id": "pdf_1fHup7chmC3DkTMKRiemQTDX9FSZwo4gV",
    "title": "الحاسوب",
    "subjectName": "الحاسوب",
    "typeOrPart": "",
    "stage": "المرحلة الإعدادية",
    "grade": "الخامس الإعدادي",
    "fileName": "كتاب الحاسوب الخامس الاعدادي.pdf",
    "driveId": "1fHup7chmC3DkTMKRiemQTDX9FSZwo4gV",
    "viewUrl": "https://drive.google.com/file/d/1fHup7chmC3DkTMKRiemQTDX9FSZwo4gV/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1fHup7chmC3DkTMKRiemQTDX9FSZwo4gV",
    "hasPdf": true
  },
  {
    "id": "pdf_11dLFVJKmVgLkaN6kUmwKHl8p5yKrxGsE",
    "title": "الرياضيات",
    "subjectName": "الرياضيات",
    "typeOrPart": "",
    "stage": "المرحلة الإعدادية",
    "grade": "الخامس الإعدادي",
    "fileName": "كتاب الرياضيات الخامس الادبي.pdf",
    "driveId": "11dLFVJKmVgLkaN6kUmwKHl8p5yKrxGsE",
    "viewUrl": "https://drive.google.com/file/d/11dLFVJKmVgLkaN6kUmwKHl8p5yKrxGsE/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=11dLFVJKmVgLkaN6kUmwKHl8p5yKrxGsE",
    "hasPdf": true
  },
  {
    "id": "pdf_1z6TYC64b7ZKLxFDo9WppsrhUT1WtF4Ip",
    "title": "الرياضيات",
    "subjectName": "الرياضيات",
    "typeOrPart": "",
    "stage": "المرحلة الإعدادية",
    "grade": "الخامس الإعدادي",
    "fileName": "كتاب الرياضيات الخامس الاعدادي.pdf",
    "driveId": "1z6TYC64b7ZKLxFDo9WppsrhUT1WtF4Ip",
    "viewUrl": "https://drive.google.com/file/d/1z6TYC64b7ZKLxFDo9WppsrhUT1WtF4Ip/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1z6TYC64b7ZKLxFDo9WppsrhUT1WtF4Ip",
    "hasPdf": true
  },
  {
    "id": "pdf_1ayKPcsQTz4DHBJX-TuCa3WV_Dm8QzkiH",
    "title": "الفلسفة وعلم النفس",
    "subjectName": "الفلسفة وعلم النفس",
    "typeOrPart": "",
    "stage": "المرحلة الإعدادية",
    "grade": "الخامس الإعدادي",
    "fileName": "كتاب_الفلسفة_وعلم_النفس_الخامس_الادبي.pdf",
    "driveId": "1ayKPcsQTz4DHBJX-TuCa3WV_Dm8QzkiH",
    "viewUrl": "https://drive.google.com/file/d/1ayKPcsQTz4DHBJX-TuCa3WV_Dm8QzkiH/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1ayKPcsQTz4DHBJX-TuCa3WV_Dm8QzkiH",
    "hasPdf": true
  },
  {
    "id": "pdf_1M3ZQV0GsD5vzDB-WbY0D_vr9kGQMtTwf",
    "title": "الفيزياء",
    "subjectName": "الفيزياء",
    "typeOrPart": "",
    "stage": "المرحلة الإعدادية",
    "grade": "الخامس الإعدادي",
    "fileName": "كتاب الفيزياء الخامس الاعدادي.pdf",
    "driveId": "1M3ZQV0GsD5vzDB-WbY0D_vr9kGQMtTwf",
    "viewUrl": "https://drive.google.com/file/d/1M3ZQV0GsD5vzDB-WbY0D_vr9kGQMtTwf/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1M3ZQV0GsD5vzDB-WbY0D_vr9kGQMtTwf",
    "hasPdf": true
  },
  {
    "id": "pdf_1BKU5fWOZKPxBR9T8YlDU49B5RVmQlun7",
    "title": "الكيمياء",
    "subjectName": "الكيمياء",
    "typeOrPart": "",
    "stage": "المرحلة الإعدادية",
    "grade": "الخامس الإعدادي",
    "fileName": "كتاب الكيمياء الخامس الاعدادي.pdf",
    "driveId": "1BKU5fWOZKPxBR9T8YlDU49B5RVmQlun7",
    "viewUrl": "https://drive.google.com/file/d/1BKU5fWOZKPxBR9T8YlDU49B5RVmQlun7/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1BKU5fWOZKPxBR9T8YlDU49B5RVmQlun7",
    "hasPdf": true
  },
  {
    "id": "pdf_1iNkgosKRXJDKkorc4qieiedM5jwrs0Y8",
    "title": "اللغة الفرنسية",
    "subjectName": "اللغة الفرنسية",
    "typeOrPart": "",
    "stage": "المرحلة الإعدادية",
    "grade": "الخامس الإعدادي",
    "fileName": "كتاب الفرنسي الخامس الاعدادي.pdf",
    "driveId": "1iNkgosKRXJDKkorc4qieiedM5jwrs0Y8",
    "viewUrl": "https://drive.google.com/file/d/1iNkgosKRXJDKkorc4qieiedM5jwrs0Y8/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1iNkgosKRXJDKkorc4qieiedM5jwrs0Y8",
    "hasPdf": true
  },
  {
    "id": "pdf_1E0_9ORPtcV_5eAXx5cU1ElEfrzqK7XpQ",
    "title": "اللغة الكردية",
    "subjectName": "اللغة الكردية",
    "typeOrPart": "",
    "stage": "المرحلة الإعدادية",
    "grade": "الخامس الإعدادي",
    "fileName": "كتاب الكردي الخامس الاعدادي.pdf",
    "driveId": "1E0_9ORPtcV_5eAXx5cU1ElEfrzqK7XpQ",
    "viewUrl": "https://drive.google.com/file/d/1E0_9ORPtcV_5eAXx5cU1ElEfrzqK7XpQ/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1E0_9ORPtcV_5eAXx5cU1ElEfrzqK7XpQ",
    "hasPdf": true
  },
  {
    "id": "pdf_1Y12LZ7-GLTCbCCaveHVZ5TV3dn293dSw",
    "title": "علم الأرض",
    "subjectName": "علم الأرض",
    "typeOrPart": "",
    "stage": "المرحلة الإعدادية",
    "grade": "الخامس الإعدادي",
    "fileName": "كتاب علم الارض الخامس الاعدادي.pdf",
    "driveId": "1Y12LZ7-GLTCbCCaveHVZ5TV3dn293dSw",
    "viewUrl": "https://drive.google.com/file/d/1Y12LZ7-GLTCbCCaveHVZ5TV3dn293dSw/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1Y12LZ7-GLTCbCCaveHVZ5TV3dn293dSw",
    "hasPdf": true
  },
  {
    "id": "pdf_1nN4ptFdz97QmvduJDsBPUrDMinSOt5ui",
    "title": "الأحياء",
    "subjectName": "الأحياء",
    "typeOrPart": "",
    "stage": "المرحلة الإعدادية",
    "grade": "الرابع الإعدادي",
    "fileName": "كتاب الاحياء الرابع العلمي.pdf",
    "driveId": "1nN4ptFdz97QmvduJDsBPUrDMinSOt5ui",
    "viewUrl": "https://drive.google.com/file/d/1nN4ptFdz97QmvduJDsBPUrDMinSOt5ui/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1nN4ptFdz97QmvduJDsBPUrDMinSOt5ui",
    "hasPdf": true
  },
  {
    "id": "pdf_1Kv72SsTF_xKZeXZOTi7LV_eraN60DxJb",
    "title": "التاريخ",
    "subjectName": "التاريخ",
    "typeOrPart": "",
    "stage": "المرحلة الإعدادية",
    "grade": "الرابع الإعدادي",
    "fileName": "كتاب التاريخ الرابع الادبي.pdf",
    "driveId": "1Kv72SsTF_xKZeXZOTi7LV_eraN60DxJb",
    "viewUrl": "https://drive.google.com/file/d/1Kv72SsTF_xKZeXZOTi7LV_eraN60DxJb/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1Kv72SsTF_xKZeXZOTi7LV_eraN60DxJb",
    "hasPdf": true
  },
  {
    "id": "pdf_1fpgmogVV7EE4y8dSdDMYwWkpqdnK9IuU",
    "title": "التربية الإسلامية",
    "subjectName": "التربية الإسلامية",
    "typeOrPart": "",
    "stage": "المرحلة الإعدادية",
    "grade": "الرابع الإعدادي",
    "fileName": "كتاب الاسلامية الرابع الاعدادي.pdf",
    "driveId": "1fpgmogVV7EE4y8dSdDMYwWkpqdnK9IuU",
    "viewUrl": "https://drive.google.com/file/d/1fpgmogVV7EE4y8dSdDMYwWkpqdnK9IuU/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1fpgmogVV7EE4y8dSdDMYwWkpqdnK9IuU",
    "hasPdf": true
  },
  {
    "id": "pdf_1BLGuTUChO-Mz6NcBMrgO9pkuEOwmhOa4",
    "title": "الجغرافية",
    "subjectName": "الجغرافية",
    "typeOrPart": "",
    "stage": "المرحلة الإعدادية",
    "grade": "الرابع الإعدادي",
    "fileName": "كتاب الجغرافية الرابع الادبي.pdf",
    "driveId": "1BLGuTUChO-Mz6NcBMrgO9pkuEOwmhOa4",
    "viewUrl": "https://drive.google.com/file/d/1BLGuTUChO-Mz6NcBMrgO9pkuEOwmhOa4/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1BLGuTUChO-Mz6NcBMrgO9pkuEOwmhOa4",
    "hasPdf": true
  },
  {
    "id": "pdf_15glrgwS1SHe1onWerH0OH0C9gr3cFDee",
    "title": "الحاسوب",
    "subjectName": "الحاسوب",
    "typeOrPart": "",
    "stage": "المرحلة الإعدادية",
    "grade": "الرابع الإعدادي",
    "fileName": "كتاب الحاسوب الرابع الاعدادي.pdf",
    "driveId": "15glrgwS1SHe1onWerH0OH0C9gr3cFDee",
    "viewUrl": "https://drive.google.com/file/d/15glrgwS1SHe1onWerH0OH0C9gr3cFDee/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=15glrgwS1SHe1onWerH0OH0C9gr3cFDee",
    "hasPdf": true
  },
  {
    "id": "pdf_1PVNUBazZ5crsqqEcP6hFry30dc2NVTaJ",
    "title": "الرياضيات",
    "subjectName": "الرياضيات",
    "typeOrPart": "",
    "stage": "المرحلة الإعدادية",
    "grade": "الرابع الإعدادي",
    "fileName": "كتاب الرياضيات الرابع الادبي.pdf",
    "driveId": "1PVNUBazZ5crsqqEcP6hFry30dc2NVTaJ",
    "viewUrl": "https://drive.google.com/file/d/1PVNUBazZ5crsqqEcP6hFry30dc2NVTaJ/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1PVNUBazZ5crsqqEcP6hFry30dc2NVTaJ",
    "hasPdf": true
  },
  {
    "id": "pdf_1Jadeb67dVvOeJ8ncSk5XwxSzfI3V8MQn",
    "title": "الرياضيات",
    "subjectName": "الرياضيات",
    "typeOrPart": "",
    "stage": "المرحلة الإعدادية",
    "grade": "الرابع الإعدادي",
    "fileName": "كتاب الرياضيات الرابع العلمي.pdf",
    "driveId": "1Jadeb67dVvOeJ8ncSk5XwxSzfI3V8MQn",
    "viewUrl": "https://drive.google.com/file/d/1Jadeb67dVvOeJ8ncSk5XwxSzfI3V8MQn/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1Jadeb67dVvOeJ8ncSk5XwxSzfI3V8MQn",
    "hasPdf": true
  },
  {
    "id": "pdf_1YgMtdAt9OC9U22OR96jNtSnJDzTjrfFI",
    "title": "الفيزياء",
    "subjectName": "الفيزياء",
    "typeOrPart": "",
    "stage": "المرحلة الإعدادية",
    "grade": "الرابع الإعدادي",
    "fileName": "كتاب الفيزياء الرابع العلمي.pdf",
    "driveId": "1YgMtdAt9OC9U22OR96jNtSnJDzTjrfFI",
    "viewUrl": "https://drive.google.com/file/d/1YgMtdAt9OC9U22OR96jNtSnJDzTjrfFI/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1YgMtdAt9OC9U22OR96jNtSnJDzTjrfFI",
    "hasPdf": true
  },
  {
    "id": "pdf_1pbb9nGuDvrlggUqNCIyZ70hJZkcYZJWM",
    "title": "الكيمياء",
    "subjectName": "الكيمياء",
    "typeOrPart": "",
    "stage": "المرحلة الإعدادية",
    "grade": "الرابع الإعدادي",
    "fileName": "كتاب الكيمياء الرابع العلمي.pdf",
    "driveId": "1pbb9nGuDvrlggUqNCIyZ70hJZkcYZJWM",
    "viewUrl": "https://drive.google.com/file/d/1pbb9nGuDvrlggUqNCIyZ70hJZkcYZJWM/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1pbb9nGuDvrlggUqNCIyZ70hJZkcYZJWM",
    "hasPdf": true
  },
  {
    "id": "pdf_1zI3DFQOBUkB9vfODifxSNkTCLUAB_8RR",
    "title": "اللغة الإنجليزية (كتاب الطالب)",
    "subjectName": "اللغة الإنجليزية",
    "typeOrPart": "كتاب الطالب",
    "stage": "المرحلة الإعدادية",
    "grade": "الرابع الإعدادي",
    "fileName": "كتاب_الانكليزي_الطالب_الرابع_الاعدادي_كامل.pdf",
    "driveId": "1zI3DFQOBUkB9vfODifxSNkTCLUAB_8RR",
    "viewUrl": "https://drive.google.com/file/d/1zI3DFQOBUkB9vfODifxSNkTCLUAB_8RR/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1zI3DFQOBUkB9vfODifxSNkTCLUAB_8RR",
    "hasPdf": true
  },
  {
    "id": "pdf_13tsYPs85jtLsaksFjORdnbqMwU1RyQe_",
    "title": "اللغة الإنجليزية (كتاب النشاط)",
    "subjectName": "اللغة الإنجليزية",
    "typeOrPart": "كتاب النشاط",
    "stage": "المرحلة الإعدادية",
    "grade": "الرابع الإعدادي",
    "fileName": "كتاب_الانكليزي_النشاط_الرابع_الاعدادي_كامل.pdf",
    "driveId": "13tsYPs85jtLsaksFjORdnbqMwU1RyQe_",
    "viewUrl": "https://drive.google.com/file/d/13tsYPs85jtLsaksFjORdnbqMwU1RyQe_/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=13tsYPs85jtLsaksFjORdnbqMwU1RyQe_",
    "hasPdf": true
  },
  {
    "id": "pdf_13a5jwHsJk8-t3UbxMIJpKWZDd6Bokmsf",
    "title": "اللغة الكردية",
    "subjectName": "اللغة الكردية",
    "typeOrPart": "",
    "stage": "المرحلة الإعدادية",
    "grade": "الرابع الإعدادي",
    "fileName": "كتاب الكردي الصف الرابع الاعدادي.pdf",
    "driveId": "13a5jwHsJk8-t3UbxMIJpKWZDd6Bokmsf",
    "viewUrl": "https://drive.google.com/file/d/13a5jwHsJk8-t3UbxMIJpKWZDd6Bokmsf/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=13a5jwHsJk8-t3UbxMIJpKWZDd6Bokmsf",
    "hasPdf": true
  },
  {
    "id": "pdf_1Kfe-zJ4J_vAnpHAzwvp2SsQVnnKGE3cm",
    "title": "جرائم حزب البعث",
    "subjectName": "جرائم حزب البعث",
    "typeOrPart": "",
    "stage": "المرحلة الإعدادية",
    "grade": "الرابع الإعدادي",
    "fileName": "كتاب_جرائم_حزب_البعث_الرابع_الاعدادي.pdf",
    "driveId": "1Kfe-zJ4J_vAnpHAzwvp2SsQVnnKGE3cm",
    "viewUrl": "https://drive.google.com/file/d/1Kfe-zJ4J_vAnpHAzwvp2SsQVnnKGE3cm/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1Kfe-zJ4J_vAnpHAzwvp2SsQVnnKGE3cm",
    "hasPdf": true
  },
  {
    "id": "pdf_1_cPpVcoDvUGKDvxdy0mRrgxclUwEahB4",
    "title": "علم الاجتماع",
    "subjectName": "علم الاجتماع",
    "typeOrPart": "",
    "stage": "المرحلة الإعدادية",
    "grade": "الرابع الإعدادي",
    "fileName": "كتاب علم الاجتماع الرابع الادبي.pdf",
    "driveId": "1_cPpVcoDvUGKDvxdy0mRrgxclUwEahB4",
    "viewUrl": "https://drive.google.com/file/d/1_cPpVcoDvUGKDvxdy0mRrgxclUwEahB4/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1_cPpVcoDvUGKDvxdy0mRrgxclUwEahB4",
    "hasPdf": true
  },
  {
    "id": "pdf_1bh909PksCKOkQQBATaxojCC8z9rD1LdJ",
    "title": "الأحياء",
    "subjectName": "الأحياء",
    "typeOrPart": "",
    "stage": "المرحلة الإعدادية",
    "grade": "السادس الإعدادي",
    "fileName": "كتاب الاحياء السادس العلمي.pdf",
    "driveId": "1bh909PksCKOkQQBATaxojCC8z9rD1LdJ",
    "viewUrl": "https://drive.google.com/file/d/1bh909PksCKOkQQBATaxojCC8z9rD1LdJ/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1bh909PksCKOkQQBATaxojCC8z9rD1LdJ",
    "hasPdf": true
  },
  {
    "id": "pdf_11Zuw9EklZszUV6FvkD9XvyfI_4nq_8OP",
    "title": "الاقتصاد",
    "subjectName": "الاقتصاد",
    "typeOrPart": "",
    "stage": "المرحلة الإعدادية",
    "grade": "السادس الإعدادي",
    "fileName": "كتاب الاقتصاد السادس الادبي.pdf",
    "driveId": "11Zuw9EklZszUV6FvkD9XvyfI_4nq_8OP",
    "viewUrl": "https://drive.google.com/file/d/11Zuw9EklZszUV6FvkD9XvyfI_4nq_8OP/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=11Zuw9EklZszUV6FvkD9XvyfI_4nq_8OP",
    "hasPdf": true
  },
  {
    "id": "pdf_1rGLe1hDVrb6ZGqOjX_0hTkrRpdIJZGEq",
    "title": "التاريخ",
    "subjectName": "التاريخ",
    "typeOrPart": "",
    "stage": "المرحلة الإعدادية",
    "grade": "السادس الإعدادي",
    "fileName": "كتاب التاريخ السادس الادبي.pdf",
    "driveId": "1rGLe1hDVrb6ZGqOjX_0hTkrRpdIJZGEq",
    "viewUrl": "https://drive.google.com/file/d/1rGLe1hDVrb6ZGqOjX_0hTkrRpdIJZGEq/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1rGLe1hDVrb6ZGqOjX_0hTkrRpdIJZGEq",
    "hasPdf": true
  },
  {
    "id": "pdf_1LE_68BoUG5OM-JnElAbGSheYKfBiUvH3",
    "title": "التربية الإسلامية (نسخة 2)",
    "subjectName": "التربية الإسلامية",
    "typeOrPart": "نسخة 2",
    "stage": "المرحلة الإعدادية",
    "grade": "السادس الإعدادي",
    "fileName": "كتاب الاسلامية السادس الاعدادي (2).pdf",
    "driveId": "1LE_68BoUG5OM-JnElAbGSheYKfBiUvH3",
    "viewUrl": "https://drive.google.com/file/d/1LE_68BoUG5OM-JnElAbGSheYKfBiUvH3/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1LE_68BoUG5OM-JnElAbGSheYKfBiUvH3",
    "hasPdf": true
  },
  {
    "id": "pdf_1hhNaL0pHBdzBkFn9pvxYV2TfJamSdCjN",
    "title": "التربية الإسلامية",
    "subjectName": "التربية الإسلامية",
    "typeOrPart": "",
    "stage": "المرحلة الإعدادية",
    "grade": "السادس الإعدادي",
    "fileName": "كتاب الاسلامية السادس الاعدادي.pdf",
    "driveId": "1hhNaL0pHBdzBkFn9pvxYV2TfJamSdCjN",
    "viewUrl": "https://drive.google.com/file/d/1hhNaL0pHBdzBkFn9pvxYV2TfJamSdCjN/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1hhNaL0pHBdzBkFn9pvxYV2TfJamSdCjN",
    "hasPdf": true
  },
  {
    "id": "pdf_1sA2oYp9-LmGylmMCP6R0Ptnwt78Ua2qJ",
    "title": "الجغرافية",
    "subjectName": "الجغرافية",
    "typeOrPart": "",
    "stage": "المرحلة الإعدادية",
    "grade": "السادس الإعدادي",
    "fileName": "كتاب الجغرافية السادس الادبي.pdf",
    "driveId": "1sA2oYp9-LmGylmMCP6R0Ptnwt78Ua2qJ",
    "viewUrl": "https://drive.google.com/file/d/1sA2oYp9-LmGylmMCP6R0Ptnwt78Ua2qJ/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1sA2oYp9-LmGylmMCP6R0Ptnwt78Ua2qJ",
    "hasPdf": true
  },
  {
    "id": "pdf_1xno4nyHNWcs2Akv4gFaBjBxyNQ9PXZJW",
    "title": "الرياضيات",
    "subjectName": "الرياضيات",
    "typeOrPart": "",
    "stage": "المرحلة الإعدادية",
    "grade": "السادس الإعدادي",
    "fileName": "كتاب الرياضيات السادس الادبي.pdf",
    "driveId": "1xno4nyHNWcs2Akv4gFaBjBxyNQ9PXZJW",
    "viewUrl": "https://drive.google.com/file/d/1xno4nyHNWcs2Akv4gFaBjBxyNQ9PXZJW/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1xno4nyHNWcs2Akv4gFaBjBxyNQ9PXZJW",
    "hasPdf": true
  },
  {
    "id": "pdf_1-ZX2whzQHOpsmr7jilsxRqIHmvHhM2ep",
    "title": "الرياضيات",
    "subjectName": "الرياضيات",
    "typeOrPart": "",
    "stage": "المرحلة الإعدادية",
    "grade": "السادس الإعدادي",
    "fileName": "كتاب الرياضيات السادس العلمي.pdf",
    "driveId": "1-ZX2whzQHOpsmr7jilsxRqIHmvHhM2ep",
    "viewUrl": "https://drive.google.com/file/d/1-ZX2whzQHOpsmr7jilsxRqIHmvHhM2ep/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1-ZX2whzQHOpsmr7jilsxRqIHmvHhM2ep",
    "hasPdf": true
  },
  {
    "id": "pdf_1TYu0t4w197ui4LhusKfSiqCVmrBHENfD",
    "title": "الفيزياء",
    "subjectName": "الفيزياء",
    "typeOrPart": "",
    "stage": "المرحلة الإعدادية",
    "grade": "السادس الإعدادي",
    "fileName": "كتاب الفيزياء السادس العلمي.pdf",
    "driveId": "1TYu0t4w197ui4LhusKfSiqCVmrBHENfD",
    "viewUrl": "https://drive.google.com/file/d/1TYu0t4w197ui4LhusKfSiqCVmrBHENfD/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1TYu0t4w197ui4LhusKfSiqCVmrBHENfD",
    "hasPdf": true
  },
  {
    "id": "pdf_1GpKORr6kXMRFyeAD72d9k2Yl2Lr8OmzI",
    "title": "الكيمياء",
    "subjectName": "الكيمياء",
    "typeOrPart": "",
    "stage": "المرحلة الإعدادية",
    "grade": "السادس الإعدادي",
    "fileName": "كتاب الكيمياء السادس العلمي.pdf",
    "driveId": "1GpKORr6kXMRFyeAD72d9k2Yl2Lr8OmzI",
    "viewUrl": "https://drive.google.com/file/d/1GpKORr6kXMRFyeAD72d9k2Yl2Lr8OmzI/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1GpKORr6kXMRFyeAD72d9k2Yl2Lr8OmzI",
    "hasPdf": true
  },
  {
    "id": "pdf_1wxUB4QwtZ9D4Vb1QPAnqd9SqSptbnYxI",
    "title": "اللغة الفرنسية",
    "subjectName": "اللغة الفرنسية",
    "typeOrPart": "",
    "stage": "المرحلة الإعدادية",
    "grade": "السادس الإعدادي",
    "fileName": "كتاب الفرنسي السادس الاعدادي.pdf",
    "driveId": "1wxUB4QwtZ9D4Vb1QPAnqd9SqSptbnYxI",
    "viewUrl": "https://drive.google.com/file/d/1wxUB4QwtZ9D4Vb1QPAnqd9SqSptbnYxI/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1wxUB4QwtZ9D4Vb1QPAnqd9SqSptbnYxI",
    "hasPdf": true
  },
  {
    "id": "pdf_126jKRq3chU1nlskuGjI6w4u-e0wwJmxS",
    "title": "الأدب الإنجليزي",
    "subjectName": "الأدب الإنجليزي",
    "typeOrPart": "",
    "stage": "المرحلة الإعدادية",
    "grade": "السادس الإعدادي",
    "fileName": "كتاب الادب انكليزي سادس اعدادي.pdf",
    "driveId": "126jKRq3chU1nlskuGjI6w4u-e0wwJmxS",
    "viewUrl": "https://drive.google.com/file/d/126jKRq3chU1nlskuGjI6w4u-e0wwJmxS/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=126jKRq3chU1nlskuGjI6w4u-e0wwJmxS",
    "hasPdf": true
  },
  {
    "id": "pdf_1NzO-PvUst3bobbP9NrYMHWP5hRzXXySf",
    "title": "الأدب الإنجليزي",
    "subjectName": "الأدب الإنجليزي",
    "typeOrPart": "",
    "stage": "المرحلة الإعدادية",
    "grade": "السادس الإعدادي",
    "fileName": "كتاب_تمارين_الادب_انكليزي_سادس_اعدادي.pdf",
    "driveId": "1NzO-PvUst3bobbP9NrYMHWP5hRzXXySf",
    "viewUrl": "https://drive.google.com/file/d/1NzO-PvUst3bobbP9NrYMHWP5hRzXXySf/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1NzO-PvUst3bobbP9NrYMHWP5hRzXXySf",
    "hasPdf": true
  },
  {
    "id": "pdf_14-Ze1qv38TQ2mQM4J5Bgfuxg0YoVI5cv",
    "title": "اللغة الإنجليزية (كتاب الطالب)",
    "subjectName": "اللغة الإنجليزية",
    "typeOrPart": "كتاب الطالب",
    "stage": "المرحلة الإعدادية",
    "grade": "السادس الإعدادي",
    "fileName": "كتاب_الانكليزي_الطالب_خامس_اعدادي.pdf",
    "driveId": "14-Ze1qv38TQ2mQM4J5Bgfuxg0YoVI5cv",
    "viewUrl": "https://drive.google.com/file/d/14-Ze1qv38TQ2mQM4J5Bgfuxg0YoVI5cv/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=14-Ze1qv38TQ2mQM4J5Bgfuxg0YoVI5cv",
    "hasPdf": true
  },
  {
    "id": "pdf_1xu3cLE3aCiBLhAB7yIHdGbNxS9x1Zhi7",
    "title": "اللغة الإنجليزية (كتاب النشاط)",
    "subjectName": "اللغة الإنجليزية",
    "typeOrPart": "كتاب النشاط",
    "stage": "المرحلة الإعدادية",
    "grade": "السادس الإعدادي",
    "fileName": "كتاب_الانكليزي_النشاط_خامس_اعدادي.pdf",
    "driveId": "1xu3cLE3aCiBLhAB7yIHdGbNxS9x1Zhi7",
    "viewUrl": "https://drive.google.com/file/d/1xu3cLE3aCiBLhAB7yIHdGbNxS9x1Zhi7/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1xu3cLE3aCiBLhAB7yIHdGbNxS9x1Zhi7",
    "hasPdf": true
  },
  {
    "id": "pdf_1cZccoIf0yiZFWjRWSReVBXaIGAo42OxM",
    "title": "اللغة الفرنسية",
    "subjectName": "اللغة الفرنسية",
    "typeOrPart": "",
    "stage": "المرحلة الإعدادية",
    "grade": "السادس الإعدادي",
    "fileName": "كتاب_الفرنسي_المنهج_الجديد_الرابع_والخامس_والسادس_الاعدادي.pdf",
    "driveId": "1cZccoIf0yiZFWjRWSReVBXaIGAo42OxM",
    "viewUrl": "https://drive.google.com/file/d/1cZccoIf0yiZFWjRWSReVBXaIGAo42OxM/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1cZccoIf0yiZFWjRWSReVBXaIGAo42OxM",
    "hasPdf": true
  },
  {
    "id": "pdf_1xGsZdhUhXQf1P9bg2Sf_RgZATHObB5Qx",
    "title": "الاجتماعيات",
    "subjectName": "الاجتماعيات",
    "typeOrPart": "",
    "stage": "المرحلة المتوسطة",
    "grade": "الأول المتوسط",
    "fileName": "كتاب الاجتماعيات اول متوسط.pdf",
    "driveId": "1xGsZdhUhXQf1P9bg2Sf_RgZATHObB5Qx",
    "viewUrl": "https://drive.google.com/file/d/1xGsZdhUhXQf1P9bg2Sf_RgZATHObB5Qx/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1xGsZdhUhXQf1P9bg2Sf_RgZATHObB5Qx",
    "hasPdf": true
  },
  {
    "id": "pdf_1K0cVd45tI4BarFYU97oQoGTAfos_I4hm",
    "title": "الأحياء",
    "subjectName": "الأحياء",
    "typeOrPart": "",
    "stage": "المرحلة المتوسطة",
    "grade": "الأول المتوسط",
    "fileName": "كتاب الاحياء اول متوسط.pdf",
    "driveId": "1K0cVd45tI4BarFYU97oQoGTAfos_I4hm",
    "viewUrl": "https://drive.google.com/file/d/1K0cVd45tI4BarFYU97oQoGTAfos_I4hm/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1K0cVd45tI4BarFYU97oQoGTAfos_I4hm",
    "hasPdf": true
  },
  {
    "id": "pdf_1sHfLwMatp01Ss3fA0FCiWrrIiArk3ay9",
    "title": "التربية الأخلاقية",
    "subjectName": "التربية الأخلاقية",
    "typeOrPart": "",
    "stage": "المرحلة المتوسطة",
    "grade": "الأول المتوسط",
    "fileName": "كتاب التربية الاخلاقية اول متوسط.pdf",
    "driveId": "1sHfLwMatp01Ss3fA0FCiWrrIiArk3ay9",
    "viewUrl": "https://drive.google.com/file/d/1sHfLwMatp01Ss3fA0FCiWrrIiArk3ay9/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1sHfLwMatp01Ss3fA0FCiWrrIiArk3ay9",
    "hasPdf": true
  },
  {
    "id": "pdf_1SDOsJMFkGcVzrFfCkpCBQ6BNuhO4YGcV",
    "title": "التربية الإسلامية",
    "subjectName": "التربية الإسلامية",
    "typeOrPart": "",
    "stage": "المرحلة المتوسطة",
    "grade": "الأول المتوسط",
    "fileName": "كتاب الاسلامية اول متوسط.pdf",
    "driveId": "1SDOsJMFkGcVzrFfCkpCBQ6BNuhO4YGcV",
    "viewUrl": "https://drive.google.com/file/d/1SDOsJMFkGcVzrFfCkpCBQ6BNuhO4YGcV/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1SDOsJMFkGcVzrFfCkpCBQ6BNuhO4YGcV",
    "hasPdf": true
  },
  {
    "id": "pdf_1XPUGb9SHPS5pvWz66B8KiM7Cj9T2lAZT",
    "title": "الحاسوب",
    "subjectName": "الحاسوب",
    "typeOrPart": "",
    "stage": "المرحلة المتوسطة",
    "grade": "الأول المتوسط",
    "fileName": "كتاب الحاسوب اول متوسط.pdf",
    "driveId": "1XPUGb9SHPS5pvWz66B8KiM7Cj9T2lAZT",
    "viewUrl": "https://drive.google.com/file/d/1XPUGb9SHPS5pvWz66B8KiM7Cj9T2lAZT/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1XPUGb9SHPS5pvWz66B8KiM7Cj9T2lAZT",
    "hasPdf": true
  },
  {
    "id": "pdf_185x54pGVyFhOrnYUJ5yo-5FefR6CfXpT",
    "title": "الرياضيات",
    "subjectName": "الرياضيات",
    "typeOrPart": "",
    "stage": "المرحلة المتوسطة",
    "grade": "الأول المتوسط",
    "fileName": "كتاب الرياضيات اول متوسط.pdf",
    "driveId": "185x54pGVyFhOrnYUJ5yo-5FefR6CfXpT",
    "viewUrl": "https://drive.google.com/file/d/185x54pGVyFhOrnYUJ5yo-5FefR6CfXpT/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=185x54pGVyFhOrnYUJ5yo-5FefR6CfXpT",
    "hasPdf": true
  },
  {
    "id": "pdf_1Yi3Gt_zPNastHfo8-JmJQvt4x664oRFY",
    "title": "الفيزياء",
    "subjectName": "الفيزياء",
    "typeOrPart": "",
    "stage": "المرحلة المتوسطة",
    "grade": "الأول المتوسط",
    "fileName": "كتاب الفيزياء اول متوسط.pdf",
    "driveId": "1Yi3Gt_zPNastHfo8-JmJQvt4x664oRFY",
    "viewUrl": "https://drive.google.com/file/d/1Yi3Gt_zPNastHfo8-JmJQvt4x664oRFY/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1Yi3Gt_zPNastHfo8-JmJQvt4x664oRFY",
    "hasPdf": true
  },
  {
    "id": "pdf_1EHdOd52zFhKdKoaeJ_-kNYWtC7u_iPZ9",
    "title": "الكيمياء",
    "subjectName": "الكيمياء",
    "typeOrPart": "",
    "stage": "المرحلة المتوسطة",
    "grade": "الأول المتوسط",
    "fileName": "كتاب الكيمياء اول متوسط.pdf",
    "driveId": "1EHdOd52zFhKdKoaeJ_-kNYWtC7u_iPZ9",
    "viewUrl": "https://drive.google.com/file/d/1EHdOd52zFhKdKoaeJ_-kNYWtC7u_iPZ9/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1EHdOd52zFhKdKoaeJ_-kNYWtC7u_iPZ9",
    "hasPdf": true
  },
  {
    "id": "pdf_1tZY4sOXgUZlDLk2n9gNAWbSHIOucJ8pL",
    "title": "اللغة الإنجليزية (كتاب الطالب)",
    "subjectName": "اللغة الإنجليزية",
    "typeOrPart": "كتاب الطالب",
    "stage": "المرحلة المتوسطة",
    "grade": "الأول المتوسط",
    "fileName": "كتاب_الانكليزي_الطالب_الاول_المتوسط.pdf",
    "driveId": "1tZY4sOXgUZlDLk2n9gNAWbSHIOucJ8pL",
    "viewUrl": "https://drive.google.com/file/d/1tZY4sOXgUZlDLk2n9gNAWbSHIOucJ8pL/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1tZY4sOXgUZlDLk2n9gNAWbSHIOucJ8pL",
    "hasPdf": true
  },
  {
    "id": "pdf_11auh5Ecwf5QrZbxOESZh5zT-SfuyDYhZ",
    "title": "اللغة الإنجليزية (كتاب النشاط)",
    "subjectName": "اللغة الإنجليزية",
    "typeOrPart": "كتاب النشاط",
    "stage": "المرحلة المتوسطة",
    "grade": "الأول المتوسط",
    "fileName": "كتاب_الانكليزي_النشاط_الاول_المتوسط.pdf",
    "driveId": "11auh5Ecwf5QrZbxOESZh5zT-SfuyDYhZ",
    "viewUrl": "https://drive.google.com/file/d/11auh5Ecwf5QrZbxOESZh5zT-SfuyDYhZ/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=11auh5Ecwf5QrZbxOESZh5zT-SfuyDYhZ",
    "hasPdf": true
  },
  {
    "id": "pdf_122MflEUorb4fmq6eON5HPjPENfD3v8_f",
    "title": "اللغة العربية (الجزء الأول)",
    "subjectName": "اللغة العربية",
    "typeOrPart": "الجزء الأول",
    "stage": "المرحلة المتوسطة",
    "grade": "الأول المتوسط",
    "fileName": "كتاب_العربي_الثاني_المتوسط_الجزء_الاول.pdf",
    "driveId": "122MflEUorb4fmq6eON5HPjPENfD3v8_f",
    "viewUrl": "https://drive.google.com/file/d/122MflEUorb4fmq6eON5HPjPENfD3v8_f/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=122MflEUorb4fmq6eON5HPjPENfD3v8_f",
    "hasPdf": true
  },
  {
    "id": "pdf_1-Ko-P10IXALN_UIE31q8aytdHu1fz9Km",
    "title": "اللغة العربية (الجزء الأول)",
    "subjectName": "اللغة العربية",
    "typeOrPart": "الجزء الأول",
    "stage": "المرحلة المتوسطة",
    "grade": "الأول المتوسط",
    "fileName": "كتاب_العربي_اول_متوسط_الجزء_الاول.pdf",
    "driveId": "1-Ko-P10IXALN_UIE31q8aytdHu1fz9Km",
    "viewUrl": "https://drive.google.com/file/d/1-Ko-P10IXALN_UIE31q8aytdHu1fz9Km/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1-Ko-P10IXALN_UIE31q8aytdHu1fz9Km",
    "hasPdf": true
  },
  {
    "id": "pdf_1caQg9Be42MFMoGaCaEAHUxkni7YSM0T-",
    "title": "اللغة العربية (الجزء الثاني)",
    "subjectName": "اللغة العربية",
    "typeOrPart": "الجزء الثاني",
    "stage": "المرحلة المتوسطة",
    "grade": "الأول المتوسط",
    "fileName": "كتاب_العربي_اول_متوسط_الجزء_الثاني.pdf",
    "driveId": "1caQg9Be42MFMoGaCaEAHUxkni7YSM0T-",
    "viewUrl": "https://drive.google.com/file/d/1caQg9Be42MFMoGaCaEAHUxkni7YSM0T-/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1caQg9Be42MFMoGaCaEAHUxkni7YSM0T-",
    "hasPdf": true
  },
  {
    "id": "pdf_1Zul7O8mO8dipcvTON5-_BDqVJbG2pYO1",
    "title": "اللغة الفرنسية (كتاب الطالب)",
    "subjectName": "اللغة الفرنسية",
    "typeOrPart": "كتاب الطالب",
    "stage": "المرحلة المتوسطة",
    "grade": "الأول المتوسط",
    "fileName": "كتاب_الطالب_الفرنسي_اول_متوسط_المنهج_الجديد.pdf",
    "driveId": "1Zul7O8mO8dipcvTON5-_BDqVJbG2pYO1",
    "viewUrl": "https://drive.google.com/file/d/1Zul7O8mO8dipcvTON5-_BDqVJbG2pYO1/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1Zul7O8mO8dipcvTON5-_BDqVJbG2pYO1",
    "hasPdf": true
  },
  {
    "id": "pdf_1SNN0l6bTlMvz7xzqWQZH1IBhsD5nkMWy",
    "title": "الاجتماعيات",
    "subjectName": "الاجتماعيات",
    "typeOrPart": "",
    "stage": "المرحلة المتوسطة",
    "grade": "الثالث المتوسط",
    "fileName": "كتاب الاجتماعيات الثالث المتوسط.pdf",
    "driveId": "1SNN0l6bTlMvz7xzqWQZH1IBhsD5nkMWy",
    "viewUrl": "https://drive.google.com/file/d/1SNN0l6bTlMvz7xzqWQZH1IBhsD5nkMWy/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1SNN0l6bTlMvz7xzqWQZH1IBhsD5nkMWy",
    "hasPdf": true
  },
  {
    "id": "pdf_1nkzzkmYYzKiFVggv4nnxtfj0HGHyE-Mi",
    "title": "التربية الإسلامية",
    "subjectName": "التربية الإسلامية",
    "typeOrPart": "",
    "stage": "المرحلة المتوسطة",
    "grade": "الثالث المتوسط",
    "fileName": "كتاب الاسلامية الثالث المتوسط.pdf",
    "driveId": "1nkzzkmYYzKiFVggv4nnxtfj0HGHyE-Mi",
    "viewUrl": "https://drive.google.com/file/d/1nkzzkmYYzKiFVggv4nnxtfj0HGHyE-Mi/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1nkzzkmYYzKiFVggv4nnxtfj0HGHyE-Mi",
    "hasPdf": true
  },
  {
    "id": "pdf_1rRJEpOhVHOULUhe3gtsw5B1c_eP4AEOo",
    "title": "الرياضيات",
    "subjectName": "الرياضيات",
    "typeOrPart": "",
    "stage": "المرحلة المتوسطة",
    "grade": "الثالث المتوسط",
    "fileName": "كتاب_الرياضيات_الثالث_المتوسط_2026_مع_التقليص_الجديد.pdf",
    "driveId": "1rRJEpOhVHOULUhe3gtsw5B1c_eP4AEOo",
    "viewUrl": "https://drive.google.com/file/d/1rRJEpOhVHOULUhe3gtsw5B1c_eP4AEOo/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1rRJEpOhVHOULUhe3gtsw5B1c_eP4AEOo",
    "hasPdf": true
  },
  {
    "id": "pdf_13qH-5mTnr3lZxY6TEaUd0-BLLO1X7kJt",
    "title": "الفيزياء",
    "subjectName": "الفيزياء",
    "typeOrPart": "",
    "stage": "المرحلة المتوسطة",
    "grade": "الثالث المتوسط",
    "fileName": "كتاب الفيزياء الثالث المتوسط.pdf",
    "driveId": "13qH-5mTnr3lZxY6TEaUd0-BLLO1X7kJt",
    "viewUrl": "https://drive.google.com/file/d/13qH-5mTnr3lZxY6TEaUd0-BLLO1X7kJt/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=13qH-5mTnr3lZxY6TEaUd0-BLLO1X7kJt",
    "hasPdf": true
  },
  {
    "id": "pdf_1JrJHiFg_CctZz9I2qJU1B6806CYJjgNZ",
    "title": "الكيمياء",
    "subjectName": "الكيمياء",
    "typeOrPart": "",
    "stage": "المرحلة المتوسطة",
    "grade": "الثالث المتوسط",
    "fileName": "كتاب الكيمياء الثالث المتوسط.pdf",
    "driveId": "1JrJHiFg_CctZz9I2qJU1B6806CYJjgNZ",
    "viewUrl": "https://drive.google.com/file/d/1JrJHiFg_CctZz9I2qJU1B6806CYJjgNZ/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1JrJHiFg_CctZz9I2qJU1B6806CYJjgNZ",
    "hasPdf": true
  },
  {
    "id": "pdf_1ITZzbXoQRfOB6xdJ1g4Xk5qgRuXwhJvU",
    "title": "اللغة الإنجليزية (كتاب الطالب)",
    "subjectName": "اللغة الإنجليزية",
    "typeOrPart": "كتاب الطالب",
    "stage": "المرحلة المتوسطة",
    "grade": "الثالث المتوسط",
    "fileName": "كتاب_الانكليزي_الطالب_الثالث_المتوسط.pdf",
    "driveId": "1ITZzbXoQRfOB6xdJ1g4Xk5qgRuXwhJvU",
    "viewUrl": "https://drive.google.com/file/d/1ITZzbXoQRfOB6xdJ1g4Xk5qgRuXwhJvU/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1ITZzbXoQRfOB6xdJ1g4Xk5qgRuXwhJvU",
    "hasPdf": true
  },
  {
    "id": "pdf_1MLmWCVDSLJNrvpWVnyP_eqS-ULtlzR9K",
    "title": "اللغة الإنجليزية (كتاب النشاط)",
    "subjectName": "اللغة الإنجليزية",
    "typeOrPart": "كتاب النشاط",
    "stage": "المرحلة المتوسطة",
    "grade": "الثالث المتوسط",
    "fileName": "كتاب_الانكليزي_النشاط_الثالث_المتوسط.pdf",
    "driveId": "1MLmWCVDSLJNrvpWVnyP_eqS-ULtlzR9K",
    "viewUrl": "https://drive.google.com/file/d/1MLmWCVDSLJNrvpWVnyP_eqS-ULtlzR9K/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1MLmWCVDSLJNrvpWVnyP_eqS-ULtlzR9K",
    "hasPdf": true
  },
  {
    "id": "pdf_1Zad-F3N0PTDIPL9s106l9kwLkt-jD5UZ",
    "title": "اللغة العربية",
    "subjectName": "اللغة العربية",
    "typeOrPart": "",
    "stage": "المرحلة المتوسطة",
    "grade": "الثالث المتوسط",
    "fileName": "كتاب_اللغة_العربية_الصف_الثالث_متوسط2026_1.pdf",
    "driveId": "1Zad-F3N0PTDIPL9s106l9kwLkt-jD5UZ",
    "viewUrl": "https://drive.google.com/file/d/1Zad-F3N0PTDIPL9s106l9kwLkt-jD5UZ/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1Zad-F3N0PTDIPL9s106l9kwLkt-jD5UZ",
    "hasPdf": true
  },
  {
    "id": "pdf_1FXolWIUzzqvplOYgRV0nvxkze7OVqaS1",
    "title": "اللغة العربية",
    "subjectName": "اللغة العربية",
    "typeOrPart": "",
    "stage": "المرحلة المتوسطة",
    "grade": "الثالث المتوسط",
    "fileName": "كتاب_اللغة_العربية_الصف_الثالث_متوسط2026.pdf",
    "driveId": "1FXolWIUzzqvplOYgRV0nvxkze7OVqaS1",
    "viewUrl": "https://drive.google.com/file/d/1FXolWIUzzqvplOYgRV0nvxkze7OVqaS1/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1FXolWIUzzqvplOYgRV0nvxkze7OVqaS1",
    "hasPdf": true
  },
  {
    "id": "pdf_13od5vh8y69GDK7bpuaGtaGHisQeo1Eqm",
    "title": "الاجتماعيات",
    "subjectName": "الاجتماعيات",
    "typeOrPart": "",
    "stage": "المرحلة المتوسطة",
    "grade": "الثاني المتوسط",
    "fileName": "كتاب الاجتماعيات الثاني المتوسط.pdf",
    "driveId": "13od5vh8y69GDK7bpuaGtaGHisQeo1Eqm",
    "viewUrl": "https://drive.google.com/file/d/13od5vh8y69GDK7bpuaGtaGHisQeo1Eqm/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=13od5vh8y69GDK7bpuaGtaGHisQeo1Eqm",
    "hasPdf": true
  },
  {
    "id": "pdf_1bzhAaE9aYNWEod7v5wG6Pd8mEcoQNDNe",
    "title": "الأحياء",
    "subjectName": "الأحياء",
    "typeOrPart": "",
    "stage": "المرحلة المتوسطة",
    "grade": "الثاني المتوسط",
    "fileName": "كتاب الاحياء الثاني المتوسط.pdf",
    "driveId": "1bzhAaE9aYNWEod7v5wG6Pd8mEcoQNDNe",
    "viewUrl": "https://drive.google.com/file/d/1bzhAaE9aYNWEod7v5wG6Pd8mEcoQNDNe/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1bzhAaE9aYNWEod7v5wG6Pd8mEcoQNDNe",
    "hasPdf": true
  },
  {
    "id": "pdf_1B4PmftbEE2Fuu63ESrYMQGRKPabeiBrR",
    "title": "التربية الأخلاقية",
    "subjectName": "التربية الأخلاقية",
    "typeOrPart": "",
    "stage": "المرحلة المتوسطة",
    "grade": "الثاني المتوسط",
    "fileName": "كتاب_التربية_الاخلاقية_الثاني_المتوسط.pdf",
    "driveId": "1B4PmftbEE2Fuu63ESrYMQGRKPabeiBrR",
    "viewUrl": "https://drive.google.com/file/d/1B4PmftbEE2Fuu63ESrYMQGRKPabeiBrR/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1B4PmftbEE2Fuu63ESrYMQGRKPabeiBrR",
    "hasPdf": true
  },
  {
    "id": "pdf_1A5Kod8VsqkrZii0HIPZpvBBLnuEC_NNu",
    "title": "التربية الإسلامية",
    "subjectName": "التربية الإسلامية",
    "typeOrPart": "",
    "stage": "المرحلة المتوسطة",
    "grade": "الثاني المتوسط",
    "fileName": "كتاب الاسلامية الثاني المتوسط.pdf",
    "driveId": "1A5Kod8VsqkrZii0HIPZpvBBLnuEC_NNu",
    "viewUrl": "https://drive.google.com/file/d/1A5Kod8VsqkrZii0HIPZpvBBLnuEC_NNu/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1A5Kod8VsqkrZii0HIPZpvBBLnuEC_NNu",
    "hasPdf": true
  },
  {
    "id": "pdf_1HG6qNzAhXhfF2lx7Y_jY9Zk0QNIpl65I",
    "title": "الحاسوب",
    "subjectName": "الحاسوب",
    "typeOrPart": "",
    "stage": "المرحلة المتوسطة",
    "grade": "الثاني المتوسط",
    "fileName": "كتاب الحاسوب الثاني المتوسط.pdf",
    "driveId": "1HG6qNzAhXhfF2lx7Y_jY9Zk0QNIpl65I",
    "viewUrl": "https://drive.google.com/file/d/1HG6qNzAhXhfF2lx7Y_jY9Zk0QNIpl65I/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1HG6qNzAhXhfF2lx7Y_jY9Zk0QNIpl65I",
    "hasPdf": true
  },
  {
    "id": "pdf_1Kx59aOLBPM9sf0YkFNW01MzKkX83Y7n9",
    "title": "الرياضيات",
    "subjectName": "الرياضيات",
    "typeOrPart": "",
    "stage": "المرحلة المتوسطة",
    "grade": "الثاني المتوسط",
    "fileName": "كتاب الرياضيات الثاني المتوسط.pdf",
    "driveId": "1Kx59aOLBPM9sf0YkFNW01MzKkX83Y7n9",
    "viewUrl": "https://drive.google.com/file/d/1Kx59aOLBPM9sf0YkFNW01MzKkX83Y7n9/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1Kx59aOLBPM9sf0YkFNW01MzKkX83Y7n9",
    "hasPdf": true
  },
  {
    "id": "pdf_1M-PX802_ijL7rILOrpAVXltMAs_z2mJp",
    "title": "الفيزياء",
    "subjectName": "الفيزياء",
    "typeOrPart": "",
    "stage": "المرحلة المتوسطة",
    "grade": "الثاني المتوسط",
    "fileName": "كتاب الفيزياء الثاني المتوسط.pdf",
    "driveId": "1M-PX802_ijL7rILOrpAVXltMAs_z2mJp",
    "viewUrl": "https://drive.google.com/file/d/1M-PX802_ijL7rILOrpAVXltMAs_z2mJp/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1M-PX802_ijL7rILOrpAVXltMAs_z2mJp",
    "hasPdf": true
  },
  {
    "id": "pdf_1elUAt1ZZVwGjBycjxRu0e3L5DUHeCwtQ",
    "title": "الكيمياء",
    "subjectName": "الكيمياء",
    "typeOrPart": "",
    "stage": "المرحلة المتوسطة",
    "grade": "الثاني المتوسط",
    "fileName": "كتاب الكيمياء الثاني المتوسط.pdf",
    "driveId": "1elUAt1ZZVwGjBycjxRu0e3L5DUHeCwtQ",
    "viewUrl": "https://drive.google.com/file/d/1elUAt1ZZVwGjBycjxRu0e3L5DUHeCwtQ/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1elUAt1ZZVwGjBycjxRu0e3L5DUHeCwtQ",
    "hasPdf": true
  },
  {
    "id": "pdf_11X-4Sk60VbOtw6PWtvNFiZeNC-9904kS",
    "title": "اللغة الإنجليزية (كتاب الطالب)",
    "subjectName": "اللغة الإنجليزية",
    "typeOrPart": "كتاب الطالب",
    "stage": "المرحلة المتوسطة",
    "grade": "الثاني المتوسط",
    "fileName": "كتاب_الانكليزي_الطالب_الثاني_المتوسط.pdf",
    "driveId": "11X-4Sk60VbOtw6PWtvNFiZeNC-9904kS",
    "viewUrl": "https://drive.google.com/file/d/11X-4Sk60VbOtw6PWtvNFiZeNC-9904kS/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=11X-4Sk60VbOtw6PWtvNFiZeNC-9904kS",
    "hasPdf": true
  },
  {
    "id": "pdf_1uMHYx5A8DFLYtwHHFbSNb_VJLH1BK6GB",
    "title": "اللغة الإنجليزية (كتاب النشاط)",
    "subjectName": "اللغة الإنجليزية",
    "typeOrPart": "كتاب النشاط",
    "stage": "المرحلة المتوسطة",
    "grade": "الثاني المتوسط",
    "fileName": "كتاب_الانكليزي_النشاط_الثاني_المتوسط.pdf",
    "driveId": "1uMHYx5A8DFLYtwHHFbSNb_VJLH1BK6GB",
    "viewUrl": "https://drive.google.com/file/d/1uMHYx5A8DFLYtwHHFbSNb_VJLH1BK6GB/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1uMHYx5A8DFLYtwHHFbSNb_VJLH1BK6GB",
    "hasPdf": true
  },
  {
    "id": "pdf_1ncWTe3m8o-Lnt0d2CQLs7vXk60n6svTP",
    "title": "اللغة العربية (الجزء الثاني)",
    "subjectName": "اللغة العربية",
    "typeOrPart": "الجزء الثاني",
    "stage": "المرحلة المتوسطة",
    "grade": "الثاني المتوسط",
    "fileName": "كتاب_العربي_الثاني_المتوسط_الجزء_الثاني.pdf",
    "driveId": "1ncWTe3m8o-Lnt0d2CQLs7vXk60n6svTP",
    "viewUrl": "https://drive.google.com/file/d/1ncWTe3m8o-Lnt0d2CQLs7vXk60n6svTP/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1ncWTe3m8o-Lnt0d2CQLs7vXk60n6svTP",
    "hasPdf": true
  },
  {
    "id": "pdf_1wQUw1TKEryHv-uriYpqhtOgrlbqREJAz",
    "title": "اللغة الفرنسية (كتاب الطالب)",
    "subjectName": "اللغة الفرنسية",
    "typeOrPart": "كتاب الطالب",
    "stage": "المرحلة المتوسطة",
    "grade": "الثاني المتوسط",
    "fileName": "كتاب_الطالب_الفرنسي_الثاني_متوسط_المنهج_الجديد.pdf",
    "driveId": "1wQUw1TKEryHv-uriYpqhtOgrlbqREJAz",
    "viewUrl": "https://drive.google.com/file/d/1wQUw1TKEryHv-uriYpqhtOgrlbqREJAz/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1wQUw1TKEryHv-uriYpqhtOgrlbqREJAz",
    "hasPdf": true
  },
  {
    "id": "pdf_1H6NhG9CRXri37WfdHItchTI6WCMoQC8T",
    "title": "اللغة الفرنسية",
    "subjectName": "اللغة الفرنسية",
    "typeOrPart": "",
    "stage": "المرحلة المتوسطة",
    "grade": "الأول المتوسط",
    "fileName": "كتاب_الفرنسي_المرحلة_المتوسطة_المنهج_الجديد.pdf",
    "driveId": "1H6NhG9CRXri37WfdHItchTI6WCMoQC8T",
    "viewUrl": "https://drive.google.com/file/d/1H6NhG9CRXri37WfdHItchTI6WCMoQC8T/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1H6NhG9CRXri37WfdHItchTI6WCMoQC8T",
    "hasPdf": true
  },
  {
    "id": "pdf_1tqG4zqXQsvKGS-ue5BR8LewpW4PK51ci",
    "title": "حلول وترجمة (كتاب النشاط)",
    "subjectName": "حلول وترجمة",
    "typeOrPart": "كتاب النشاط",
    "stage": "المرحلة المتوسطة",
    "grade": "الأول المتوسط",
    "fileName": "حلول_وترجمة_الوحدة_الاولى_المنهج_الجديد_كتاب_الطالب_وكتاب_النشاط.pdf",
    "driveId": "1tqG4zqXQsvKGS-ue5BR8LewpW4PK51ci",
    "viewUrl": "https://drive.google.com/file/d/1tqG4zqXQsvKGS-ue5BR8LewpW4PK51ci/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1tqG4zqXQsvKGS-ue5BR8LewpW4PK51ci",
    "hasPdf": true
  },
  {
    "id": "pdf_1ojKQyvmfUCn2SsuVf2gRKJFk8d1XCM8B",
    "title": "الأحياء",
    "subjectName": "الأحياء",
    "typeOrPart": "",
    "stage": "المرحلة المتوسطة",
    "grade": "الأول المتوسط",
    "fileName": "كتاب الاحياء المنقح 2025.pdf",
    "driveId": "1ojKQyvmfUCn2SsuVf2gRKJFk8d1XCM8B",
    "viewUrl": "https://drive.google.com/file/d/1ojKQyvmfUCn2SsuVf2gRKJFk8d1XCM8B/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1ojKQyvmfUCn2SsuVf2gRKJFk8d1XCM8B",
    "hasPdf": true
  }
];

/**
 * تنظيف ومقارنة النصوص العربية بدقة
 */
export function cleanArabicText(str = ''): string {
  return str
    .replace(/[ً-ٟـ]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ئ|ؤ/g, 'ء')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * استخراج مفتاح الصف والمرحلة بدقة للمطابقة الموثوقة
 */
export function extractGradeKey(grade = '', stage = ''): { gradeNum: string; stageKey: string } {
  const text = cleanArabicText(grade + ' ' + stage);
  let gradeNum = '';
  if (/اول|1|1st/.test(text)) gradeNum = '1';
  else if (/ثاني|2|2nd/.test(text)) gradeNum = '2';
  else if (/ثالث|3|3rd/.test(text)) gradeNum = '3';
  else if (/رابع|4|4th/.test(text)) gradeNum = '4';
  else if (/خامس|5|5th/.test(text)) gradeNum = '5';
  else if (/سادس|6|6th/.test(text)) gradeNum = '6';

  let stageKey = '';
  if (/ابتدائي/.test(text)) stageKey = 'ابتدائي';
  else if (/متوسط/.test(text)) stageKey = 'متوسط';
  else if (/اعدادي|ثانوي/.test(text)) stageKey = 'اعدادي';

  return { gradeNum, stageKey };
}

/**
 * تحويل رابط Google Drive إلى رابط Preview قابل للعرض في Iframe / WebView بدون حجب X-Frame-Options
 */
export function toGoogleDrivePreviewUrl(url = '', driveId?: string): string {
  if (driveId) {
    return `https://drive.google.com/file/d/${driveId}/preview`;
  }
  if (!url) return '';
  const fileMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch && fileMatch[1]) {
    return `https://drive.google.com/file/d/${fileMatch[1]}/preview`;
  }
  const ucMatch = url.match(/(?:drive|docs)\.google\.com\/uc\?.*id=([a-zA-Z0-9_-]+)/);
  if (ucMatch && ucMatch[1]) {
    return `https://drive.google.com/file/d/${ucMatch[1]}/preview`;
  }
  return url;
}

/**
 * تحويل رابط Google Drive إلى رابط تنزيل مباشر يتجاوز شاشة الفحص للملفات الكبيرة
 */
export function toGoogleDriveDownloadUrl(url = '', driveId?: string): string {
  if (driveId) {
    return `https://drive.usercontent.google.com/download?id=${driveId}&export=download&authuser=0&confirm=t`;
  }
  if (!url) return '';
  const fileMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch && fileMatch[1]) {
    return `https://drive.usercontent.google.com/download?id=${fileMatch[1]}&export=download&authuser=0&confirm=t`;
  }
  return url;
}

/**
 * الحصول على قائمة المواد والكتب المتوفرة لصف معين في مرحلة معينة
 */
export function getBooksForGrade(stage: string, grade: string): CurriculumBook[] {
  const targetKey = extractGradeKey(grade, stage);

  return ALL_CURRICULUM_BOOKS.filter(b => {
    const bKey = extractGradeKey(b.grade, b.stage);
    const matchGrade = targetKey.gradeNum ? bKey.gradeNum === targetKey.gradeNum : true;
    const matchStage = targetKey.stageKey ? bKey.stageKey === targetKey.stageKey : true;
    return matchGrade && matchStage;
  });
}

/**
 * البحث عن كتاب معين بدقة مع معالجة جميع صيغ الأسماء والصفوف
 */
export function findBook(params: {
  subjectName: string;
  grade: string;
  stage?: string;
}): CurriculumBook | undefined {
  const normSubj = cleanArabicText(params.subjectName);
  const targetKey = extractGradeKey(params.grade, params.stage);

  // 1. مطابقة دقيقة حسب الصف والمرحلة أولاً + اسم المادة
  if (targetKey.gradeNum || targetKey.stageKey) {
    const candidates = ALL_CURRICULUM_BOOKS.filter(b => {
      const bKey = extractGradeKey(b.grade, b.stage);
      const matchGrade = targetKey.gradeNum ? bKey.gradeNum === targetKey.gradeNum : true;
      const matchStage = targetKey.stageKey ? bKey.stageKey === targetKey.stageKey : true;
      return matchGrade && matchStage;
    });

    if (candidates.length > 0) {
      // البحث عن تطابق الاسم داخل مرشحي نفس الصف
      const exactCandidate = candidates.find(b => {
        const bSubj = cleanArabicText(b.subjectName);
        const bTitle = cleanArabicText(b.title);
        return bSubj === normSubj || bTitle === normSubj || bSubj.includes(normSubj) || normSubj.includes(bSubj);
      });
      if (exactCandidate) return exactCandidate;

      // تطابق مرن داخل نفس الصف
      const fuzzyCandidate = candidates.find(b => {
        const bFile = cleanArabicText(b.fileName);
        return bFile.includes(normSubj) || normSubj.split(' ').some(w => w.length > 2 && bFile.includes(w));
      });
      if (fuzzyCandidate) return fuzzyCandidate;
    }
  }

  // 2. مطابقة عامة بالاسم في الكتالوج بالكامل
  const globalExact = ALL_CURRICULUM_BOOKS.find(b => {
    const bSubj = cleanArabicText(b.subjectName);
    const bTitle = cleanArabicText(b.title);
    return bSubj === normSubj || bTitle === normSubj;
  });
  if (globalExact) return globalExact;

  return ALL_CURRICULUM_BOOKS.find(b => {
    const bFile = cleanArabicText(b.fileName);
    return bFile.includes(normSubj);
  });
}

