/**
 * دليل وروابط عرض وتنزيل ملفات PDF للمناهج العراقية (للقراءة والعرض المباشر).
 * مصدر البيانات: فهرس_المناهج_وروابط_التحميل.xlsx
 * عدد الكتب: 124
 */

export interface CurriculumPdfLink {
  fileName: string;
  stage: string;
  grade: string;
  subject: string;
  typeOrPart?: string;
  driveId: string;
  viewUrl: string;
  downloadUrl: string;
}

export const PDF_CURRICULUM_CATALOG: CurriculumPdfLink[] = [
  {
    "fileName": "كتاب_الاجتماعيات_الخامس_الابتدائي.pdf",
    "stage": "المرحلة الابتدائية",
    "grade": "الصف الخامس",
    "subject": "الاجتماعيات",
    "typeOrPart": "",
    "driveId": "1QgvRRuBtcbNcC5rfmYlyuSZPGxY3qifp",
    "viewUrl": "https://drive.google.com/file/d/1QgvRRuBtcbNcC5rfmYlyuSZPGxY3qifp/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1QgvRRuBtcbNcC5rfmYlyuSZPGxY3qifp"
  },
  {
    "fileName": "كتاب الاسلامية الخامس الابتدائي.pdf",
    "stage": "المرحلة الابتدائية",
    "grade": "الصف الخامس",
    "subject": "التربية الإسلامية",
    "typeOrPart": "",
    "driveId": "1GPZTILrAe4Gkk3guZQjFGYf98B7MaCtI",
    "viewUrl": "https://drive.google.com/file/d/1GPZTILrAe4Gkk3guZQjFGYf98B7MaCtI/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1GPZTILrAe4Gkk3guZQjFGYf98B7MaCtI"
  },
  {
    "fileName": "كتاب الرياضيات الخامس الابتدائي.pdf",
    "stage": "المرحلة الابتدائية",
    "grade": "الصف الخامس",
    "subject": "الرياضيات",
    "typeOrPart": "",
    "driveId": "1-F3KiprpPfsFK11BtZ9llvjABGEMT9sg",
    "viewUrl": "https://drive.google.com/file/d/1-F3KiprpPfsFK11BtZ9llvjABGEMT9sg/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1-F3KiprpPfsFK11BtZ9llvjABGEMT9sg"
  },
  {
    "fileName": "كتاب_الرياضيات_التمرينات_الخامس_الابتدائي.pdf",
    "stage": "المرحلة الابتدائية",
    "grade": "الصف الخامس",
    "subject": "الرياضيات",
    "typeOrPart": "",
    "driveId": "1WvVHbTlf0GRD8MNuaXQG5RN-0GwmDfBn",
    "viewUrl": "https://drive.google.com/file/d/1WvVHbTlf0GRD8MNuaXQG5RN-0GwmDfBn/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1WvVHbTlf0GRD8MNuaXQG5RN-0GwmDfBn"
  },
  {
    "fileName": "كتاب العلوم الخامس الابتدائي.pdf",
    "stage": "المرحلة الابتدائية",
    "grade": "الصف الخامس",
    "subject": "العلوم",
    "typeOrPart": "",
    "driveId": "1WAPXCPqGBJ2cWtUynB6iDWByDrfLm3vX",
    "viewUrl": "https://drive.google.com/file/d/1WAPXCPqGBJ2cWtUynB6iDWByDrfLm3vX/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1WAPXCPqGBJ2cWtUynB6iDWByDrfLm3vX"
  },
  {
    "fileName": "كتاب_العلوم_النشاط_الخامس_الابتدائي.pdf",
    "stage": "المرحلة الابتدائية",
    "grade": "الصف الخامس",
    "subject": "العلوم",
    "typeOrPart": "كتاب النشاط",
    "driveId": "1UlCpFOIRwavl3s1Ds5eU_DI8Z6aQKfH8",
    "viewUrl": "https://drive.google.com/file/d/1UlCpFOIRwavl3s1Ds5eU_DI8Z6aQKfH8/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1UlCpFOIRwavl3s1Ds5eU_DI8Z6aQKfH8"
  },
  {
    "fileName": "كتاب القراءة الخامس الابتدائي.pdf",
    "stage": "المرحلة الابتدائية",
    "grade": "الصف الخامس",
    "subject": "القراءة",
    "typeOrPart": "",
    "driveId": "19sQIRpC5YjIXSeqZuntttSh4sPspsmcd",
    "viewUrl": "https://drive.google.com/file/d/19sQIRpC5YjIXSeqZuntttSh4sPspsmcd/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=19sQIRpC5YjIXSeqZuntttSh4sPspsmcd"
  },
  {
    "fileName": "كتاب القواعد الخامس الابتدائي.pdf",
    "stage": "المرحلة الابتدائية",
    "grade": "الصف الخامس",
    "subject": "القواعد",
    "typeOrPart": "",
    "driveId": "1fIDxBvAmfcIcEPuk7aKicQ0ktKJrFCq-",
    "viewUrl": "https://drive.google.com/file/d/1fIDxBvAmfcIcEPuk7aKicQ0ktKJrFCq-/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1fIDxBvAmfcIcEPuk7aKicQ0ktKJrFCq-"
  },
  {
    "fileName": "كتاب_الانكليزي_الطالب_الصف_الخامس_الابتدائي.pdf",
    "stage": "المرحلة الابتدائية",
    "grade": "الصف الخامس",
    "subject": "اللغة الإنجليزية",
    "typeOrPart": "كتاب الطالب",
    "driveId": "1z-M4fxmzIG4sYBwzC1jiatrz_plFBsrF",
    "viewUrl": "https://drive.google.com/file/d/1z-M4fxmzIG4sYBwzC1jiatrz_plFBsrF/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1z-M4fxmzIG4sYBwzC1jiatrz_plFBsrF"
  },
  {
    "fileName": "كتاب_الانكليزي_النشاط_الصف_الخامس_الابتدائي.pdf",
    "stage": "المرحلة الابتدائية",
    "grade": "الصف الخامس",
    "subject": "اللغة الإنجليزية",
    "typeOrPart": "كتاب النشاط",
    "driveId": "1z9FfY1ycAKz-4CbqEk3sdf6lknSdxr3p",
    "viewUrl": "https://drive.google.com/file/d/1z9FfY1ycAKz-4CbqEk3sdf6lknSdxr3p/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1z9FfY1ycAKz-4CbqEk3sdf6lknSdxr3p"
  },
  {
    "fileName": "كتاب_الاجتماعيات_الرابع_الابتدائي.pdf",
    "stage": "المرحلة الابتدائية",
    "grade": "الصف الرابع",
    "subject": "الاجتماعيات",
    "typeOrPart": "",
    "driveId": "16pH_ip2_k7gT-lIEHAU_aW3VDUq3hltW",
    "viewUrl": "https://drive.google.com/file/d/16pH_ip2_k7gT-lIEHAU_aW3VDUq3hltW/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=16pH_ip2_k7gT-lIEHAU_aW3VDUq3hltW"
  },
  {
    "fileName": "كتاب الاسلامية الرابع الابتدائي.pdf",
    "stage": "المرحلة الابتدائية",
    "grade": "الصف الرابع",
    "subject": "التربية الإسلامية",
    "typeOrPart": "",
    "driveId": "16jHS_GRMPXzdow2SSmQ5XCVkki4kQIbW",
    "viewUrl": "https://drive.google.com/file/d/16jHS_GRMPXzdow2SSmQ5XCVkki4kQIbW/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=16jHS_GRMPXzdow2SSmQ5XCVkki4kQIbW"
  },
  {
    "fileName": "كتاب الرياضيات الرابع الابتدائي.pdf",
    "stage": "المرحلة الابتدائية",
    "grade": "الصف الرابع",
    "subject": "الرياضيات",
    "typeOrPart": "",
    "driveId": "1SPAhK8cyoUgBb4EHn04QW7gCoiNtRD-1",
    "viewUrl": "https://drive.google.com/file/d/1SPAhK8cyoUgBb4EHn04QW7gCoiNtRD-1/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1SPAhK8cyoUgBb4EHn04QW7gCoiNtRD-1"
  },
  {
    "fileName": "كتاب_تمرينات_الرياضيات_الرابع_الابتدائي.pdf",
    "stage": "المرحلة الابتدائية",
    "grade": "الصف الرابع",
    "subject": "الرياضيات",
    "typeOrPart": "",
    "driveId": "1sLZa0fO75h7oEup_6DKEN5-DPFjeB_xZ",
    "viewUrl": "https://drive.google.com/file/d/1sLZa0fO75h7oEup_6DKEN5-DPFjeB_xZ/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1sLZa0fO75h7oEup_6DKEN5-DPFjeB_xZ"
  },
  {
    "fileName": "كتاب العلوم الرابع الابتدائي.pdf",
    "stage": "المرحلة الابتدائية",
    "grade": "الصف الرابع",
    "subject": "العلوم",
    "typeOrPart": "",
    "driveId": "1lcCWIUSltJJJmk6tdEEknuJk1SmTGCAS",
    "viewUrl": "https://drive.google.com/file/d/1lcCWIUSltJJJmk6tdEEknuJk1SmTGCAS/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1lcCWIUSltJJJmk6tdEEknuJk1SmTGCAS"
  },
  {
    "fileName": "كتاب_نشاط_العلوم_الرابع_الابتدائي.pdf",
    "stage": "المرحلة الابتدائية",
    "grade": "الصف الرابع",
    "subject": "العلوم",
    "typeOrPart": "",
    "driveId": "1neAeFVMtsvpoMmCbhTzfqZRzortNoSbq",
    "viewUrl": "https://drive.google.com/file/d/1neAeFVMtsvpoMmCbhTzfqZRzortNoSbq/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1neAeFVMtsvpoMmCbhTzfqZRzortNoSbq"
  },
  {
    "fileName": "كتاب القراءة الرابع الابتدائي.pdf",
    "stage": "المرحلة الابتدائية",
    "grade": "الصف الرابع",
    "subject": "القراءة",
    "typeOrPart": "",
    "driveId": "1rVKy097Q5MZRyLoBObFHxUoaq6xYuRy4",
    "viewUrl": "https://drive.google.com/file/d/1rVKy097Q5MZRyLoBObFHxUoaq6xYuRy4/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1rVKy097Q5MZRyLoBObFHxUoaq6xYuRy4"
  },
  {
    "fileName": "كتاب القواعد الرابع الابتدائي.pdf",
    "stage": "المرحلة الابتدائية",
    "grade": "الصف الرابع",
    "subject": "القواعد",
    "typeOrPart": "",
    "driveId": "17kQx6AiAhhQDcI9yz2-Yg3-NFd_cRlq4",
    "viewUrl": "https://drive.google.com/file/d/17kQx6AiAhhQDcI9yz2-Yg3-NFd_cRlq4/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=17kQx6AiAhhQDcI9yz2-Yg3-NFd_cRlq4"
  },
  {
    "fileName": "كتاب_الانكليزي_الطالب_الصف_الرابع_الابتدائي.pdf",
    "stage": "المرحلة الابتدائية",
    "grade": "الصف الرابع",
    "subject": "اللغة الإنجليزية",
    "typeOrPart": "كتاب الطالب",
    "driveId": "1dzFvmI63aMzofGs4MM85KZX4x6sL-qEy",
    "viewUrl": "https://drive.google.com/file/d/1dzFvmI63aMzofGs4MM85KZX4x6sL-qEy/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1dzFvmI63aMzofGs4MM85KZX4x6sL-qEy"
  },
  {
    "fileName": "كتاب_الانكليزي_النشاط_الصف_الرابع_الابتدائي.pdf",
    "stage": "المرحلة الابتدائية",
    "grade": "الصف الرابع",
    "subject": "اللغة الإنجليزية",
    "typeOrPart": "كتاب النشاط",
    "driveId": "1pi6oRiUGEb4suwCaIcfh409LUIHoHghT",
    "viewUrl": "https://drive.google.com/file/d/1pi6oRiUGEb4suwCaIcfh409LUIHoHghT/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1pi6oRiUGEb4suwCaIcfh409LUIHoHghT"
  },
  {
    "fileName": "كتاب_الاجتماعيات_السادس_الابتدائي.pdf",
    "stage": "المرحلة الابتدائية",
    "grade": "الصف السادس",
    "subject": "الاجتماعيات",
    "typeOrPart": "",
    "driveId": "1HPLIpC-mgCoxpF1WCnKFU4oigEfG1LxC",
    "viewUrl": "https://drive.google.com/file/d/1HPLIpC-mgCoxpF1WCnKFU4oigEfG1LxC/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1HPLIpC-mgCoxpF1WCnKFU4oigEfG1LxC"
  },
  {
    "fileName": "كتاب الاسلامية السادس الابتدائي.pdf",
    "stage": "المرحلة الابتدائية",
    "grade": "الصف السادس",
    "subject": "التربية الإسلامية",
    "typeOrPart": "",
    "driveId": "1wV5GJjgRBcMi4Bk2ec4qjpE4Dq9-U-g1",
    "viewUrl": "https://drive.google.com/file/d/1wV5GJjgRBcMi4Bk2ec4qjpE4Dq9-U-g1/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1wV5GJjgRBcMi4Bk2ec4qjpE4Dq9-U-g1"
  },
  {
    "fileName": "كتاب الرياضيات السادس الابتدائي.pdf",
    "stage": "المرحلة الابتدائية",
    "grade": "الصف السادس",
    "subject": "الرياضيات",
    "typeOrPart": "",
    "driveId": "1XdlOGGza2fig2mvRo41JsUHjYKs8IZP5",
    "viewUrl": "https://drive.google.com/file/d/1XdlOGGza2fig2mvRo41JsUHjYKs8IZP5/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1XdlOGGza2fig2mvRo41JsUHjYKs8IZP5"
  },
  {
    "fileName": "كتاب_تمرينات_الرياضيات_السادس_الابتدائي.pdf",
    "stage": "المرحلة الابتدائية",
    "grade": "الصف السادس",
    "subject": "الرياضيات",
    "typeOrPart": "",
    "driveId": "1b3UvcW2rzJDH0JJGut-NxEpNBiHQOvCl",
    "viewUrl": "https://drive.google.com/file/d/1b3UvcW2rzJDH0JJGut-NxEpNBiHQOvCl/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1b3UvcW2rzJDH0JJGut-NxEpNBiHQOvCl"
  },
  {
    "fileName": "كتاب العلوم السادس الابتدائي.pdf",
    "stage": "المرحلة الابتدائية",
    "grade": "الصف السادس",
    "subject": "العلوم",
    "typeOrPart": "",
    "driveId": "1S9C_aDFk-zkzsIj4Ql7UAbeYxUOoY0d0",
    "viewUrl": "https://drive.google.com/file/d/1S9C_aDFk-zkzsIj4Ql7UAbeYxUOoY0d0/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1S9C_aDFk-zkzsIj4Ql7UAbeYxUOoY0d0"
  },
  {
    "fileName": "كتاب_نشاط_العلوم_السادس_الابتدائي.pdf",
    "stage": "المرحلة الابتدائية",
    "grade": "الصف السادس",
    "subject": "العلوم",
    "typeOrPart": "",
    "driveId": "1ATJg9xwOF4fLhIzPS-tDg4WMPkpuRbxY",
    "viewUrl": "https://drive.google.com/file/d/1ATJg9xwOF4fLhIzPS-tDg4WMPkpuRbxY/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1ATJg9xwOF4fLhIzPS-tDg4WMPkpuRbxY"
  },
  {
    "fileName": "كتاب القراءة السادس الابتدائي.pdf",
    "stage": "المرحلة الابتدائية",
    "grade": "الصف السادس",
    "subject": "القراءة",
    "typeOrPart": "",
    "driveId": "1vADhSRPJRJaBv3MwdkYnWaW6nU4tKn23",
    "viewUrl": "https://drive.google.com/file/d/1vADhSRPJRJaBv3MwdkYnWaW6nU4tKn23/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1vADhSRPJRJaBv3MwdkYnWaW6nU4tKn23"
  },
  {
    "fileName": "كتاب القواعد السادس الابتدائي.pdf",
    "stage": "المرحلة الابتدائية",
    "grade": "الصف السادس",
    "subject": "القواعد",
    "typeOrPart": "",
    "driveId": "1ERFua7a0T08uo1-uFsvcT7VEvr8a0x4N",
    "viewUrl": "https://drive.google.com/file/d/1ERFua7a0T08uo1-uFsvcT7VEvr8a0x4N/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1ERFua7a0T08uo1-uFsvcT7VEvr8a0x4N"
  },
  {
    "fileName": "كتاب_الطالب_اربع_وحدات_سادس_ابتدائي_المنهج_الحديث.pdf",
    "stage": "المرحلة الابتدائية",
    "grade": "غير محدد",
    "subject": "غير محددة",
    "typeOrPart": "كتاب الطالب",
    "driveId": "1rEP4J6EQC-DsYQwj2p7rHrbsU0jXBrgp",
    "viewUrl": "https://drive.google.com/file/d/1rEP4J6EQC-DsYQwj2p7rHrbsU0jXBrgp/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1rEP4J6EQC-DsYQwj2p7rHrbsU0jXBrgp"
  },
  {
    "fileName": "كتاب_النشاط_اربع_وحدات_سادس_ابتدائي_المنهج_الحديث.pdf",
    "stage": "المرحلة الابتدائية",
    "grade": "غير محدد",
    "subject": "غير محددة",
    "typeOrPart": "كتاب النشاط",
    "driveId": "1LP1NKK_BQJxYg-OEJPpO_XL1ZmzkEmBM",
    "viewUrl": "https://drive.google.com/file/d/1LP1NKK_BQJxYg-OEJPpO_XL1ZmzkEmBM/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1LP1NKK_BQJxYg-OEJPpO_XL1ZmzkEmBM"
  },
  {
    "fileName": "كتاب_الاحياء_المؤشر_سالم_ال_منصور_السادس_العلمي_2025_الفصل_الاول.pdf",
    "stage": "المرحلة الإعدادية",
    "grade": "الصف الأول",
    "subject": "الأحياء",
    "typeOrPart": "",
    "driveId": "1-ACuATI6i5LVf9orfyFKeu7-0ab7dlDn",
    "viewUrl": "https://drive.google.com/file/d/1-ACuATI6i5LVf9orfyFKeu7-0ab7dlDn/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1-ACuATI6i5LVf9orfyFKeu7-0ab7dlDn"
  },
  {
    "fileName": "كتاب_العربي_الخامس_الاعدادي_الجزء_الاول (2).pdf",
    "stage": "المرحلة الإعدادية",
    "grade": "الصف الأول",
    "subject": "اللغة العربية",
    "typeOrPart": "الجزء الأول - نسخة 2",
    "driveId": "1BqmwE7ubZ1N8Sji5ts9_iWMSnPQQ0vQM",
    "viewUrl": "https://drive.google.com/file/d/1BqmwE7ubZ1N8Sji5ts9_iWMSnPQQ0vQM/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1BqmwE7ubZ1N8Sji5ts9_iWMSnPQQ0vQM"
  },
  {
    "fileName": "كتاب_العربي_الخامس_الاعدادي_الجزء_الاول.pdf",
    "stage": "المرحلة الإعدادية",
    "grade": "الصف الأول",
    "subject": "اللغة العربية",
    "typeOrPart": "الجزء الأول",
    "driveId": "1qp0ermqHxVL2O12YUlStEDJRsimd6I8v",
    "viewUrl": "https://drive.google.com/file/d/1qp0ermqHxVL2O12YUlStEDJRsimd6I8v/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1qp0ermqHxVL2O12YUlStEDJRsimd6I8v"
  },
  {
    "fileName": "كتاب_العربي_الرابع_الاعدادي_الجزء_الاول.pdf",
    "stage": "المرحلة الإعدادية",
    "grade": "الصف الأول",
    "subject": "اللغة العربية",
    "typeOrPart": "الجزء الأول",
    "driveId": "1p8c6_su9fsSLHcu_52FWFP8GKMcwCez8",
    "viewUrl": "https://drive.google.com/file/d/1p8c6_su9fsSLHcu_52FWFP8GKMcwCez8/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1p8c6_su9fsSLHcu_52FWFP8GKMcwCez8"
  },
  {
    "fileName": "كتاب_العربي_السادس_الاعدادي_الجزء_الاول (2).pdf",
    "stage": "المرحلة الإعدادية",
    "grade": "الصف الأول",
    "subject": "اللغة العربية",
    "typeOrPart": "الجزء الأول - نسخة 2",
    "driveId": "1nXsYuFlP6T39_phOPia6I3edzHe2Worx",
    "viewUrl": "https://drive.google.com/file/d/1nXsYuFlP6T39_phOPia6I3edzHe2Worx/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1nXsYuFlP6T39_phOPia6I3edzHe2Worx"
  },
  {
    "fileName": "كتاب_العربي_السادس_الاعدادي_الجزء_الاول.pdf",
    "stage": "المرحلة الإعدادية",
    "grade": "الصف الأول",
    "subject": "اللغة العربية",
    "typeOrPart": "الجزء الأول",
    "driveId": "1tRM74d4NPCBnioEGvXbyiaYsR0WATFLH",
    "viewUrl": "https://drive.google.com/file/d/1tRM74d4NPCBnioEGvXbyiaYsR0WATFLH/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1tRM74d4NPCBnioEGvXbyiaYsR0WATFLH"
  },
  {
    "fileName": "كتاب_العربي_الخامس_الاعدادي_الجزء_الثاني (2).pdf",
    "stage": "المرحلة الإعدادية",
    "grade": "الصف الثاني",
    "subject": "اللغة العربية",
    "typeOrPart": "الجزء الثاني - نسخة 2",
    "driveId": "1L5AJdt9CZCzqE_xZqMuuszyezq-FAEK1",
    "viewUrl": "https://drive.google.com/file/d/1L5AJdt9CZCzqE_xZqMuuszyezq-FAEK1/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1L5AJdt9CZCzqE_xZqMuuszyezq-FAEK1"
  },
  {
    "fileName": "كتاب_العربي_الخامس_الاعدادي_الجزء_الثاني.pdf",
    "stage": "المرحلة الإعدادية",
    "grade": "الصف الثاني",
    "subject": "اللغة العربية",
    "typeOrPart": "الجزء الثاني",
    "driveId": "1yOpcKFexEXqWXcpqCobz7AcBrut1L5_E",
    "viewUrl": "https://drive.google.com/file/d/1yOpcKFexEXqWXcpqCobz7AcBrut1L5_E/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1yOpcKFexEXqWXcpqCobz7AcBrut1L5_E"
  },
  {
    "fileName": "كتاب_العربي_الرابع_الاعدادي_الجزء_الثاني.pdf",
    "stage": "المرحلة الإعدادية",
    "grade": "الصف الثاني",
    "subject": "اللغة العربية",
    "typeOrPart": "الجزء الثاني",
    "driveId": "1nqWhQRxF2IO9sEkYxQ4D2TKgoocijCOR",
    "viewUrl": "https://drive.google.com/file/d/1nqWhQRxF2IO9sEkYxQ4D2TKgoocijCOR/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1nqWhQRxF2IO9sEkYxQ4D2TKgoocijCOR"
  },
  {
    "fileName": "كتاب_العربي_السادس_الاعدادي_الجزء_الثاني (2).pdf",
    "stage": "المرحلة الإعدادية",
    "grade": "الصف الثاني",
    "subject": "اللغة العربية",
    "typeOrPart": "الجزء الثاني - نسخة 2",
    "driveId": "142SasnrbI2GXHlO94Ki-1awHAYMSYmEg",
    "viewUrl": "https://drive.google.com/file/d/142SasnrbI2GXHlO94Ki-1awHAYMSYmEg/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=142SasnrbI2GXHlO94Ki-1awHAYMSYmEg"
  },
  {
    "fileName": "كتاب_العربي_السادس_الاعدادي_الجزء_الثاني.pdf",
    "stage": "المرحلة الإعدادية",
    "grade": "الصف الثاني",
    "subject": "اللغة العربية",
    "typeOrPart": "الجزء الثاني",
    "driveId": "1TSrh5niShz9DVHXkSfBw0Mf1L0kbxX7V",
    "viewUrl": "https://drive.google.com/file/d/1TSrh5niShz9DVHXkSfBw0Mf1L0kbxX7V/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1TSrh5niShz9DVHXkSfBw0Mf1L0kbxX7V"
  },
  {
    "fileName": "كتاب الاحياء الخامس الاعدادي.pdf",
    "stage": "المرحلة الإعدادية",
    "grade": "الصف الخامس",
    "subject": "الأحياء",
    "typeOrPart": "",
    "driveId": "138CmHJP_1nr8KOCPiFmG5ziiJVA1u5AS",
    "viewUrl": "https://drive.google.com/file/d/138CmHJP_1nr8KOCPiFmG5ziiJVA1u5AS/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=138CmHJP_1nr8KOCPiFmG5ziiJVA1u5AS"
  },
  {
    "fileName": "كتاب التاريخ الخامس الادبي.pdf",
    "stage": "المرحلة الإعدادية",
    "grade": "الصف الخامس",
    "subject": "التاريخ",
    "typeOrPart": "",
    "driveId": "17sVV5LdhNkgK5XVuZw4Diu3pGtYCUu80",
    "viewUrl": "https://drive.google.com/file/d/17sVV5LdhNkgK5XVuZw4Diu3pGtYCUu80/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=17sVV5LdhNkgK5XVuZw4Diu3pGtYCUu80"
  },
  {
    "fileName": "كتاب الاسلامية الخامس الاعدادي (2).pdf",
    "stage": "المرحلة الإعدادية",
    "grade": "الصف الخامس",
    "subject": "التربية الإسلامية",
    "typeOrPart": "نسخة 2",
    "driveId": "1F8AWC5Go8Bn4ka0ZgHivs6vELI9DaW3F",
    "viewUrl": "https://drive.google.com/file/d/1F8AWC5Go8Bn4ka0ZgHivs6vELI9DaW3F/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1F8AWC5Go8Bn4ka0ZgHivs6vELI9DaW3F"
  },
  {
    "fileName": "كتاب الاسلامية الخامس الاعدادي.pdf",
    "stage": "المرحلة الإعدادية",
    "grade": "الصف الخامس",
    "subject": "التربية الإسلامية",
    "typeOrPart": "",
    "driveId": "18-K2yY5Yt3egcxw1WxNbtOfGGYUUerV4",
    "viewUrl": "https://drive.google.com/file/d/18-K2yY5Yt3egcxw1WxNbtOfGGYUUerV4/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=18-K2yY5Yt3egcxw1WxNbtOfGGYUUerV4"
  },
  {
    "fileName": "كتاب الجغرافية الخامس الادبي.pdf",
    "stage": "المرحلة الإعدادية",
    "grade": "الصف الخامس",
    "subject": "الجغرافية",
    "typeOrPart": "",
    "driveId": "1lK78oLVoWXUUBZNNzqi1VgkF8pZ6nT2W",
    "viewUrl": "https://drive.google.com/file/d/1lK78oLVoWXUUBZNNzqi1VgkF8pZ6nT2W/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1lK78oLVoWXUUBZNNzqi1VgkF8pZ6nT2W"
  },
  {
    "fileName": "كتاب الحاسوب الخامس الاعدادي (2).pdf",
    "stage": "المرحلة الإعدادية",
    "grade": "الصف الخامس",
    "subject": "الحاسوب",
    "typeOrPart": "نسخة 2",
    "driveId": "126VL4S66C_FboiOpYRbtYOyWk8CLvry4",
    "viewUrl": "https://drive.google.com/file/d/126VL4S66C_FboiOpYRbtYOyWk8CLvry4/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=126VL4S66C_FboiOpYRbtYOyWk8CLvry4"
  },
  {
    "fileName": "كتاب الحاسوب الخامس الاعدادي.pdf",
    "stage": "المرحلة الإعدادية",
    "grade": "الصف الخامس",
    "subject": "الحاسوب",
    "typeOrPart": "",
    "driveId": "1fHup7chmC3DkTMKRiemQTDX9FSZwo4gV",
    "viewUrl": "https://drive.google.com/file/d/1fHup7chmC3DkTMKRiemQTDX9FSZwo4gV/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1fHup7chmC3DkTMKRiemQTDX9FSZwo4gV"
  },
  {
    "fileName": "كتاب الرياضيات الخامس الادبي.pdf",
    "stage": "المرحلة الإعدادية",
    "grade": "الصف الخامس",
    "subject": "الرياضيات",
    "typeOrPart": "",
    "driveId": "11dLFVJKmVgLkaN6kUmwKHl8p5yKrxGsE",
    "viewUrl": "https://drive.google.com/file/d/11dLFVJKmVgLkaN6kUmwKHl8p5yKrxGsE/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=11dLFVJKmVgLkaN6kUmwKHl8p5yKrxGsE"
  },
  {
    "fileName": "كتاب الرياضيات الخامس الاعدادي.pdf",
    "stage": "المرحلة الإعدادية",
    "grade": "الصف الخامس",
    "subject": "الرياضيات",
    "typeOrPart": "",
    "driveId": "1z6TYC64b7ZKLxFDo9WppsrhUT1WtF4Ip",
    "viewUrl": "https://drive.google.com/file/d/1z6TYC64b7ZKLxFDo9WppsrhUT1WtF4Ip/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1z6TYC64b7ZKLxFDo9WppsrhUT1WtF4Ip"
  },
  {
    "fileName": "كتاب_الفلسفة_وعلم_النفس_الخامس_الادبي.pdf",
    "stage": "المرحلة الإعدادية",
    "grade": "الصف الخامس",
    "subject": "الفلسفة وعلم النفس",
    "typeOrPart": "",
    "driveId": "1ayKPcsQTz4DHBJX-TuCa3WV_Dm8QzkiH",
    "viewUrl": "https://drive.google.com/file/d/1ayKPcsQTz4DHBJX-TuCa3WV_Dm8QzkiH/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1ayKPcsQTz4DHBJX-TuCa3WV_Dm8QzkiH"
  },
  {
    "fileName": "كتاب الفيزياء الخامس الاعدادي.pdf",
    "stage": "المرحلة الإعدادية",
    "grade": "الصف الخامس",
    "subject": "الفيزياء",
    "typeOrPart": "",
    "driveId": "1M3ZQV0GsD5vzDB-WbY0D_vr9kGQMtTwf",
    "viewUrl": "https://drive.google.com/file/d/1M3ZQV0GsD5vzDB-WbY0D_vr9kGQMtTwf/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1M3ZQV0GsD5vzDB-WbY0D_vr9kGQMtTwf"
  },
  {
    "fileName": "كتاب الكيمياء الخامس الاعدادي.pdf",
    "stage": "المرحلة الإعدادية",
    "grade": "الصف الخامس",
    "subject": "الكيمياء",
    "typeOrPart": "",
    "driveId": "1BKU5fWOZKPxBR9T8YlDU49B5RVmQlun7",
    "viewUrl": "https://drive.google.com/file/d/1BKU5fWOZKPxBR9T8YlDU49B5RVmQlun7/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1BKU5fWOZKPxBR9T8YlDU49B5RVmQlun7"
  },
  {
    "fileName": "كتاب الفرنسي الخامس الاعدادي.pdf",
    "stage": "المرحلة الإعدادية",
    "grade": "الصف الخامس",
    "subject": "اللغة الفرنسية",
    "typeOrPart": "",
    "driveId": "1iNkgosKRXJDKkorc4qieiedM5jwrs0Y8",
    "viewUrl": "https://drive.google.com/file/d/1iNkgosKRXJDKkorc4qieiedM5jwrs0Y8/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1iNkgosKRXJDKkorc4qieiedM5jwrs0Y8"
  },
  {
    "fileName": "كتاب الكردي الخامس الاعدادي.pdf",
    "stage": "المرحلة الإعدادية",
    "grade": "الصف الخامس",
    "subject": "اللغة الكردية",
    "typeOrPart": "",
    "driveId": "1E0_9ORPtcV_5eAXx5cU1ElEfrzqK7XpQ",
    "viewUrl": "https://drive.google.com/file/d/1E0_9ORPtcV_5eAXx5cU1ElEfrzqK7XpQ/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1E0_9ORPtcV_5eAXx5cU1ElEfrzqK7XpQ"
  },
  {
    "fileName": "كتاب علم الارض الخامس الاعدادي.pdf",
    "stage": "المرحلة الإعدادية",
    "grade": "الصف الخامس",
    "subject": "علم الأرض",
    "typeOrPart": "",
    "driveId": "1Y12LZ7-GLTCbCCaveHVZ5TV3dn293dSw",
    "viewUrl": "https://drive.google.com/file/d/1Y12LZ7-GLTCbCCaveHVZ5TV3dn293dSw/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1Y12LZ7-GLTCbCCaveHVZ5TV3dn293dSw"
  },
  {
    "fileName": "كتاب الاحياء الرابع العلمي.pdf",
    "stage": "المرحلة الإعدادية",
    "grade": "الصف الرابع",
    "subject": "الأحياء",
    "typeOrPart": "",
    "driveId": "1nN4ptFdz97QmvduJDsBPUrDMinSOt5ui",
    "viewUrl": "https://drive.google.com/file/d/1nN4ptFdz97QmvduJDsBPUrDMinSOt5ui/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1nN4ptFdz97QmvduJDsBPUrDMinSOt5ui"
  },
  {
    "fileName": "كتاب التاريخ الرابع الادبي.pdf",
    "stage": "المرحلة الإعدادية",
    "grade": "الصف الرابع",
    "subject": "التاريخ",
    "typeOrPart": "",
    "driveId": "1Kv72SsTF_xKZeXZOTi7LV_eraN60DxJb",
    "viewUrl": "https://drive.google.com/file/d/1Kv72SsTF_xKZeXZOTi7LV_eraN60DxJb/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1Kv72SsTF_xKZeXZOTi7LV_eraN60DxJb"
  },
  {
    "fileName": "كتاب الاسلامية الرابع الاعدادي.pdf",
    "stage": "المرحلة الإعدادية",
    "grade": "الصف الرابع",
    "subject": "التربية الإسلامية",
    "typeOrPart": "",
    "driveId": "1fpgmogVV7EE4y8dSdDMYwWkpqdnK9IuU",
    "viewUrl": "https://drive.google.com/file/d/1fpgmogVV7EE4y8dSdDMYwWkpqdnK9IuU/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1fpgmogVV7EE4y8dSdDMYwWkpqdnK9IuU"
  },
  {
    "fileName": "كتاب الجغرافية الرابع الادبي.pdf",
    "stage": "المرحلة الإعدادية",
    "grade": "الصف الرابع",
    "subject": "الجغرافية",
    "typeOrPart": "",
    "driveId": "1BLGuTUChO-Mz6NcBMrgO9pkuEOwmhOa4",
    "viewUrl": "https://drive.google.com/file/d/1BLGuTUChO-Mz6NcBMrgO9pkuEOwmhOa4/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1BLGuTUChO-Mz6NcBMrgO9pkuEOwmhOa4"
  },
  {
    "fileName": "كتاب الحاسوب الرابع الاعدادي.pdf",
    "stage": "المرحلة الإعدادية",
    "grade": "الصف الرابع",
    "subject": "الحاسوب",
    "typeOrPart": "",
    "driveId": "15glrgwS1SHe1onWerH0OH0C9gr3cFDee",
    "viewUrl": "https://drive.google.com/file/d/15glrgwS1SHe1onWerH0OH0C9gr3cFDee/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=15glrgwS1SHe1onWerH0OH0C9gr3cFDee"
  },
  {
    "fileName": "كتاب الرياضيات الرابع الادبي.pdf",
    "stage": "المرحلة الإعدادية",
    "grade": "الصف الرابع",
    "subject": "الرياضيات",
    "typeOrPart": "",
    "driveId": "1PVNUBazZ5crsqqEcP6hFry30dc2NVTaJ",
    "viewUrl": "https://drive.google.com/file/d/1PVNUBazZ5crsqqEcP6hFry30dc2NVTaJ/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1PVNUBazZ5crsqqEcP6hFry30dc2NVTaJ"
  },
  {
    "fileName": "كتاب الرياضيات الرابع العلمي.pdf",
    "stage": "المرحلة الإعدادية",
    "grade": "الصف الرابع",
    "subject": "الرياضيات",
    "typeOrPart": "",
    "driveId": "1Jadeb67dVvOeJ8ncSk5XwxSzfI3V8MQn",
    "viewUrl": "https://drive.google.com/file/d/1Jadeb67dVvOeJ8ncSk5XwxSzfI3V8MQn/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1Jadeb67dVvOeJ8ncSk5XwxSzfI3V8MQn"
  },
  {
    "fileName": "كتاب الفيزياء الرابع العلمي.pdf",
    "stage": "المرحلة الإعدادية",
    "grade": "الصف الرابع",
    "subject": "الفيزياء",
    "typeOrPart": "",
    "driveId": "1YgMtdAt9OC9U22OR96jNtSnJDzTjrfFI",
    "viewUrl": "https://drive.google.com/file/d/1YgMtdAt9OC9U22OR96jNtSnJDzTjrfFI/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1YgMtdAt9OC9U22OR96jNtSnJDzTjrfFI"
  },
  {
    "fileName": "كتاب الكيمياء الرابع العلمي.pdf",
    "stage": "المرحلة الإعدادية",
    "grade": "الصف الرابع",
    "subject": "الكيمياء",
    "typeOrPart": "",
    "driveId": "1pbb9nGuDvrlggUqNCIyZ70hJZkcYZJWM",
    "viewUrl": "https://drive.google.com/file/d/1pbb9nGuDvrlggUqNCIyZ70hJZkcYZJWM/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1pbb9nGuDvrlggUqNCIyZ70hJZkcYZJWM"
  },
  {
    "fileName": "كتاب_الانكليزي_الطالب_الرابع_الاعدادي_كامل.pdf",
    "stage": "المرحلة الإعدادية",
    "grade": "الصف الرابع",
    "subject": "اللغة الإنجليزية",
    "typeOrPart": "كتاب الطالب",
    "driveId": "1zI3DFQOBUkB9vfODifxSNkTCLUAB_8RR",
    "viewUrl": "https://drive.google.com/file/d/1zI3DFQOBUkB9vfODifxSNkTCLUAB_8RR/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1zI3DFQOBUkB9vfODifxSNkTCLUAB_8RR"
  },
  {
    "fileName": "كتاب_الانكليزي_النشاط_الرابع_الاعدادي_كامل.pdf",
    "stage": "المرحلة الإعدادية",
    "grade": "الصف الرابع",
    "subject": "اللغة الإنجليزية",
    "typeOrPart": "كتاب النشاط",
    "driveId": "13tsYPs85jtLsaksFjORdnbqMwU1RyQe_",
    "viewUrl": "https://drive.google.com/file/d/13tsYPs85jtLsaksFjORdnbqMwU1RyQe_/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=13tsYPs85jtLsaksFjORdnbqMwU1RyQe_"
  },
  {
    "fileName": "كتاب الكردي الصف الرابع الاعدادي.pdf",
    "stage": "المرحلة الإعدادية",
    "grade": "الصف الرابع",
    "subject": "اللغة الكردية",
    "typeOrPart": "",
    "driveId": "13a5jwHsJk8-t3UbxMIJpKWZDd6Bokmsf",
    "viewUrl": "https://drive.google.com/file/d/13a5jwHsJk8-t3UbxMIJpKWZDd6Bokmsf/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=13a5jwHsJk8-t3UbxMIJpKWZDd6Bokmsf"
  },
  {
    "fileName": "كتاب_جرائم_حزب_البعث_الرابع_الاعدادي.pdf",
    "stage": "المرحلة الإعدادية",
    "grade": "الصف الرابع",
    "subject": "جرائم حزب البعث",
    "typeOrPart": "",
    "driveId": "1Kfe-zJ4J_vAnpHAzwvp2SsQVnnKGE3cm",
    "viewUrl": "https://drive.google.com/file/d/1Kfe-zJ4J_vAnpHAzwvp2SsQVnnKGE3cm/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1Kfe-zJ4J_vAnpHAzwvp2SsQVnnKGE3cm"
  },
  {
    "fileName": "كتاب علم الاجتماع الرابع الادبي.pdf",
    "stage": "المرحلة الإعدادية",
    "grade": "الصف الرابع",
    "subject": "علم الاجتماع",
    "typeOrPart": "",
    "driveId": "1_cPpVcoDvUGKDvxdy0mRrgxclUwEahB4",
    "viewUrl": "https://drive.google.com/file/d/1_cPpVcoDvUGKDvxdy0mRrgxclUwEahB4/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1_cPpVcoDvUGKDvxdy0mRrgxclUwEahB4"
  },
  {
    "fileName": "كتاب الاحياء السادس العلمي.pdf",
    "stage": "المرحلة الإعدادية",
    "grade": "الصف السادس",
    "subject": "الأحياء",
    "typeOrPart": "",
    "driveId": "1bh909PksCKOkQQBATaxojCC8z9rD1LdJ",
    "viewUrl": "https://drive.google.com/file/d/1bh909PksCKOkQQBATaxojCC8z9rD1LdJ/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1bh909PksCKOkQQBATaxojCC8z9rD1LdJ"
  },
  {
    "fileName": "كتاب الاقتصاد السادس الادبي.pdf",
    "stage": "المرحلة الإعدادية",
    "grade": "الصف السادس",
    "subject": "الاقتصاد",
    "typeOrPart": "",
    "driveId": "11Zuw9EklZszUV6FvkD9XvyfI_4nq_8OP",
    "viewUrl": "https://drive.google.com/file/d/11Zuw9EklZszUV6FvkD9XvyfI_4nq_8OP/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=11Zuw9EklZszUV6FvkD9XvyfI_4nq_8OP"
  },
  {
    "fileName": "كتاب التاريخ السادس الادبي.pdf",
    "stage": "المرحلة الإعدادية",
    "grade": "الصف السادس",
    "subject": "التاريخ",
    "typeOrPart": "",
    "driveId": "1rGLe1hDVrb6ZGqOjX_0hTkrRpdIJZGEq",
    "viewUrl": "https://drive.google.com/file/d/1rGLe1hDVrb6ZGqOjX_0hTkrRpdIJZGEq/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1rGLe1hDVrb6ZGqOjX_0hTkrRpdIJZGEq"
  },
  {
    "fileName": "كتاب الاسلامية السادس الاعدادي (2).pdf",
    "stage": "المرحلة الإعدادية",
    "grade": "الصف السادس",
    "subject": "التربية الإسلامية",
    "typeOrPart": "نسخة 2",
    "driveId": "1LE_68BoUG5OM-JnElAbGSheYKfBiUvH3",
    "viewUrl": "https://drive.google.com/file/d/1LE_68BoUG5OM-JnElAbGSheYKfBiUvH3/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1LE_68BoUG5OM-JnElAbGSheYKfBiUvH3"
  },
  {
    "fileName": "كتاب الاسلامية السادس الاعدادي.pdf",
    "stage": "المرحلة الإعدادية",
    "grade": "الصف السادس",
    "subject": "التربية الإسلامية",
    "typeOrPart": "",
    "driveId": "1hhNaL0pHBdzBkFn9pvxYV2TfJamSdCjN",
    "viewUrl": "https://drive.google.com/file/d/1hhNaL0pHBdzBkFn9pvxYV2TfJamSdCjN/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1hhNaL0pHBdzBkFn9pvxYV2TfJamSdCjN"
  },
  {
    "fileName": "كتاب الجغرافية السادس الادبي.pdf",
    "stage": "المرحلة الإعدادية",
    "grade": "الصف السادس",
    "subject": "الجغرافية",
    "typeOrPart": "",
    "driveId": "1sA2oYp9-LmGylmMCP6R0Ptnwt78Ua2qJ",
    "viewUrl": "https://drive.google.com/file/d/1sA2oYp9-LmGylmMCP6R0Ptnwt78Ua2qJ/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1sA2oYp9-LmGylmMCP6R0Ptnwt78Ua2qJ"
  },
  {
    "fileName": "كتاب الرياضيات السادس الادبي.pdf",
    "stage": "المرحلة الإعدادية",
    "grade": "الصف السادس",
    "subject": "الرياضيات",
    "typeOrPart": "",
    "driveId": "1xno4nyHNWcs2Akv4gFaBjBxyNQ9PXZJW",
    "viewUrl": "https://drive.google.com/file/d/1xno4nyHNWcs2Akv4gFaBjBxyNQ9PXZJW/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1xno4nyHNWcs2Akv4gFaBjBxyNQ9PXZJW"
  },
  {
    "fileName": "كتاب الرياضيات السادس العلمي.pdf",
    "stage": "المرحلة الإعدادية",
    "grade": "الصف السادس",
    "subject": "الرياضيات",
    "typeOrPart": "",
    "driveId": "1-ZX2whzQHOpsmr7jilsxRqIHmvHhM2ep",
    "viewUrl": "https://drive.google.com/file/d/1-ZX2whzQHOpsmr7jilsxRqIHmvHhM2ep/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1-ZX2whzQHOpsmr7jilsxRqIHmvHhM2ep"
  },
  {
    "fileName": "كتاب الفيزياء السادس العلمي.pdf",
    "stage": "المرحلة الإعدادية",
    "grade": "الصف السادس",
    "subject": "الفيزياء",
    "typeOrPart": "",
    "driveId": "1TYu0t4w197ui4LhusKfSiqCVmrBHENfD",
    "viewUrl": "https://drive.google.com/file/d/1TYu0t4w197ui4LhusKfSiqCVmrBHENfD/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1TYu0t4w197ui4LhusKfSiqCVmrBHENfD"
  },
  {
    "fileName": "كتاب الكيمياء السادس العلمي.pdf",
    "stage": "المرحلة الإعدادية",
    "grade": "الصف السادس",
    "subject": "الكيمياء",
    "typeOrPart": "",
    "driveId": "1GpKORr6kXMRFyeAD72d9k2Yl2Lr8OmzI",
    "viewUrl": "https://drive.google.com/file/d/1GpKORr6kXMRFyeAD72d9k2Yl2Lr8OmzI/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1GpKORr6kXMRFyeAD72d9k2Yl2Lr8OmzI"
  },
  {
    "fileName": "كتاب الفرنسي السادس الاعدادي.pdf",
    "stage": "المرحلة الإعدادية",
    "grade": "الصف السادس",
    "subject": "اللغة الفرنسية",
    "typeOrPart": "",
    "driveId": "1wxUB4QwtZ9D4Vb1QPAnqd9SqSptbnYxI",
    "viewUrl": "https://drive.google.com/file/d/1wxUB4QwtZ9D4Vb1QPAnqd9SqSptbnYxI/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1wxUB4QwtZ9D4Vb1QPAnqd9SqSptbnYxI"
  },
  {
    "fileName": "كتاب الادب انكليزي سادس اعدادي.pdf",
    "stage": "المرحلة الإعدادية",
    "grade": "غير محدد",
    "subject": "الأدب الإنجليزي",
    "typeOrPart": "",
    "driveId": "126jKRq3chU1nlskuGjI6w4u-e0wwJmxS",
    "viewUrl": "https://drive.google.com/file/d/126jKRq3chU1nlskuGjI6w4u-e0wwJmxS/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=126jKRq3chU1nlskuGjI6w4u-e0wwJmxS"
  },
  {
    "fileName": "كتاب_تمارين_الادب_انكليزي_سادس_اعدادي.pdf",
    "stage": "المرحلة الإعدادية",
    "grade": "غير محدد",
    "subject": "الأدب الإنجليزي",
    "typeOrPart": "",
    "driveId": "1NzO-PvUst3bobbP9NrYMHWP5hRzXXySf",
    "viewUrl": "https://drive.google.com/file/d/1NzO-PvUst3bobbP9NrYMHWP5hRzXXySf/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1NzO-PvUst3bobbP9NrYMHWP5hRzXXySf"
  },
  {
    "fileName": "كتاب_الانكليزي_الطالب_خامس_اعدادي.pdf",
    "stage": "المرحلة الإعدادية",
    "grade": "غير محدد",
    "subject": "اللغة الإنجليزية",
    "typeOrPart": "كتاب الطالب",
    "driveId": "14-Ze1qv38TQ2mQM4J5Bgfuxg0YoVI5cv",
    "viewUrl": "https://drive.google.com/file/d/14-Ze1qv38TQ2mQM4J5Bgfuxg0YoVI5cv/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=14-Ze1qv38TQ2mQM4J5Bgfuxg0YoVI5cv"
  },
  {
    "fileName": "كتاب_الانكليزي_النشاط_خامس_اعدادي.pdf",
    "stage": "المرحلة الإعدادية",
    "grade": "غير محدد",
    "subject": "اللغة الإنجليزية",
    "typeOrPart": "كتاب النشاط",
    "driveId": "1xu3cLE3aCiBLhAB7yIHdGbNxS9x1Zhi7",
    "viewUrl": "https://drive.google.com/file/d/1xu3cLE3aCiBLhAB7yIHdGbNxS9x1Zhi7/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1xu3cLE3aCiBLhAB7yIHdGbNxS9x1Zhi7"
  },
  {
    "fileName": "كتاب_الفرنسي_المنهج_الجديد_الرابع_والخامس_والسادس_الاعدادي.pdf",
    "stage": "المرحلة الإعدادية",
    "grade": "كتب عامة",
    "subject": "اللغة الفرنسية",
    "typeOrPart": "",
    "driveId": "1cZccoIf0yiZFWjRWSReVBXaIGAo42OxM",
    "viewUrl": "https://drive.google.com/file/d/1cZccoIf0yiZFWjRWSReVBXaIGAo42OxM/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1cZccoIf0yiZFWjRWSReVBXaIGAo42OxM"
  },
  {
    "fileName": "كتاب الاجتماعيات اول متوسط.pdf",
    "stage": "المرحلة المتوسطة",
    "grade": "الصف الأول",
    "subject": "الاجتماعيات",
    "typeOrPart": "",
    "driveId": "1xGsZdhUhXQf1P9bg2Sf_RgZATHObB5Qx",
    "viewUrl": "https://drive.google.com/file/d/1xGsZdhUhXQf1P9bg2Sf_RgZATHObB5Qx/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1xGsZdhUhXQf1P9bg2Sf_RgZATHObB5Qx"
  },
  {
    "fileName": "كتاب الاحياء اول متوسط.pdf",
    "stage": "المرحلة المتوسطة",
    "grade": "الصف الأول",
    "subject": "الأحياء",
    "typeOrPart": "",
    "driveId": "1K0cVd45tI4BarFYU97oQoGTAfos_I4hm",
    "viewUrl": "https://drive.google.com/file/d/1K0cVd45tI4BarFYU97oQoGTAfos_I4hm/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1K0cVd45tI4BarFYU97oQoGTAfos_I4hm"
  },
  {
    "fileName": "كتاب التربية الاخلاقية اول متوسط.pdf",
    "stage": "المرحلة المتوسطة",
    "grade": "الصف الأول",
    "subject": "التربية الأخلاقية",
    "typeOrPart": "",
    "driveId": "1sHfLwMatp01Ss3fA0FCiWrrIiArk3ay9",
    "viewUrl": "https://drive.google.com/file/d/1sHfLwMatp01Ss3fA0FCiWrrIiArk3ay9/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1sHfLwMatp01Ss3fA0FCiWrrIiArk3ay9"
  },
  {
    "fileName": "كتاب الاسلامية اول متوسط.pdf",
    "stage": "المرحلة المتوسطة",
    "grade": "الصف الأول",
    "subject": "التربية الإسلامية",
    "typeOrPart": "",
    "driveId": "1SDOsJMFkGcVzrFfCkpCBQ6BNuhO4YGcV",
    "viewUrl": "https://drive.google.com/file/d/1SDOsJMFkGcVzrFfCkpCBQ6BNuhO4YGcV/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1SDOsJMFkGcVzrFfCkpCBQ6BNuhO4YGcV"
  },
  {
    "fileName": "كتاب الحاسوب اول متوسط.pdf",
    "stage": "المرحلة المتوسطة",
    "grade": "الصف الأول",
    "subject": "الحاسوب",
    "typeOrPart": "",
    "driveId": "1XPUGb9SHPS5pvWz66B8KiM7Cj9T2lAZT",
    "viewUrl": "https://drive.google.com/file/d/1XPUGb9SHPS5pvWz66B8KiM7Cj9T2lAZT/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1XPUGb9SHPS5pvWz66B8KiM7Cj9T2lAZT"
  },
  {
    "fileName": "كتاب الرياضيات اول متوسط.pdf",
    "stage": "المرحلة المتوسطة",
    "grade": "الصف الأول",
    "subject": "الرياضيات",
    "typeOrPart": "",
    "driveId": "185x54pGVyFhOrnYUJ5yo-5FefR6CfXpT",
    "viewUrl": "https://drive.google.com/file/d/185x54pGVyFhOrnYUJ5yo-5FefR6CfXpT/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=185x54pGVyFhOrnYUJ5yo-5FefR6CfXpT"
  },
  {
    "fileName": "كتاب الفيزياء اول متوسط.pdf",
    "stage": "المرحلة المتوسطة",
    "grade": "الصف الأول",
    "subject": "الفيزياء",
    "typeOrPart": "",
    "driveId": "1Yi3Gt_zPNastHfo8-JmJQvt4x664oRFY",
    "viewUrl": "https://drive.google.com/file/d/1Yi3Gt_zPNastHfo8-JmJQvt4x664oRFY/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1Yi3Gt_zPNastHfo8-JmJQvt4x664oRFY"
  },
  {
    "fileName": "كتاب الكيمياء اول متوسط.pdf",
    "stage": "المرحلة المتوسطة",
    "grade": "الصف الأول",
    "subject": "الكيمياء",
    "typeOrPart": "",
    "driveId": "1EHdOd52zFhKdKoaeJ_-kNYWtC7u_iPZ9",
    "viewUrl": "https://drive.google.com/file/d/1EHdOd52zFhKdKoaeJ_-kNYWtC7u_iPZ9/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1EHdOd52zFhKdKoaeJ_-kNYWtC7u_iPZ9"
  },
  {
    "fileName": "كتاب_الانكليزي_الطالب_الاول_المتوسط.pdf",
    "stage": "المرحلة المتوسطة",
    "grade": "الصف الأول",
    "subject": "اللغة الإنجليزية",
    "typeOrPart": "كتاب الطالب",
    "driveId": "1tZY4sOXgUZlDLk2n9gNAWbSHIOucJ8pL",
    "viewUrl": "https://drive.google.com/file/d/1tZY4sOXgUZlDLk2n9gNAWbSHIOucJ8pL/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1tZY4sOXgUZlDLk2n9gNAWbSHIOucJ8pL"
  },
  {
    "fileName": "كتاب_الانكليزي_النشاط_الاول_المتوسط.pdf",
    "stage": "المرحلة المتوسطة",
    "grade": "الصف الأول",
    "subject": "اللغة الإنجليزية",
    "typeOrPart": "كتاب النشاط",
    "driveId": "11auh5Ecwf5QrZbxOESZh5zT-SfuyDYhZ",
    "viewUrl": "https://drive.google.com/file/d/11auh5Ecwf5QrZbxOESZh5zT-SfuyDYhZ/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=11auh5Ecwf5QrZbxOESZh5zT-SfuyDYhZ"
  },
  {
    "fileName": "كتاب_العربي_الثاني_المتوسط_الجزء_الاول.pdf",
    "stage": "المرحلة المتوسطة",
    "grade": "الصف الأول",
    "subject": "اللغة العربية",
    "typeOrPart": "الجزء الأول",
    "driveId": "122MflEUorb4fmq6eON5HPjPENfD3v8_f",
    "viewUrl": "https://drive.google.com/file/d/122MflEUorb4fmq6eON5HPjPENfD3v8_f/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=122MflEUorb4fmq6eON5HPjPENfD3v8_f"
  },
  {
    "fileName": "كتاب_العربي_اول_متوسط_الجزء_الاول.pdf",
    "stage": "المرحلة المتوسطة",
    "grade": "الصف الأول",
    "subject": "اللغة العربية",
    "typeOrPart": "الجزء الأول",
    "driveId": "1-Ko-P10IXALN_UIE31q8aytdHu1fz9Km",
    "viewUrl": "https://drive.google.com/file/d/1-Ko-P10IXALN_UIE31q8aytdHu1fz9Km/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1-Ko-P10IXALN_UIE31q8aytdHu1fz9Km"
  },
  {
    "fileName": "كتاب_العربي_اول_متوسط_الجزء_الثاني.pdf",
    "stage": "المرحلة المتوسطة",
    "grade": "الصف الأول",
    "subject": "اللغة العربية",
    "typeOrPart": "الجزء الثاني",
    "driveId": "1caQg9Be42MFMoGaCaEAHUxkni7YSM0T-",
    "viewUrl": "https://drive.google.com/file/d/1caQg9Be42MFMoGaCaEAHUxkni7YSM0T-/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1caQg9Be42MFMoGaCaEAHUxkni7YSM0T-"
  },
  {
    "fileName": "كتاب_الطالب_الفرنسي_اول_متوسط_المنهج_الجديد.pdf",
    "stage": "المرحلة المتوسطة",
    "grade": "الصف الأول",
    "subject": "اللغة الفرنسية",
    "typeOrPart": "كتاب الطالب",
    "driveId": "1Zul7O8mO8dipcvTON5-_BDqVJbG2pYO1",
    "viewUrl": "https://drive.google.com/file/d/1Zul7O8mO8dipcvTON5-_BDqVJbG2pYO1/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1Zul7O8mO8dipcvTON5-_BDqVJbG2pYO1"
  },
  {
    "fileName": "كتاب الاجتماعيات الثالث المتوسط.pdf",
    "stage": "المرحلة المتوسطة",
    "grade": "الصف الثالث",
    "subject": "الاجتماعيات",
    "typeOrPart": "",
    "driveId": "1SNN0l6bTlMvz7xzqWQZH1IBhsD5nkMWy",
    "viewUrl": "https://drive.google.com/file/d/1SNN0l6bTlMvz7xzqWQZH1IBhsD5nkMWy/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1SNN0l6bTlMvz7xzqWQZH1IBhsD5nkMWy"
  },
  {
    "fileName": "كتاب الاسلامية الثالث المتوسط.pdf",
    "stage": "المرحلة المتوسطة",
    "grade": "الصف الثالث",
    "subject": "التربية الإسلامية",
    "typeOrPart": "",
    "driveId": "1nkzzkmYYzKiFVggv4nnxtfj0HGHyE-Mi",
    "viewUrl": "https://drive.google.com/file/d/1nkzzkmYYzKiFVggv4nnxtfj0HGHyE-Mi/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1nkzzkmYYzKiFVggv4nnxtfj0HGHyE-Mi"
  },
  {
    "fileName": "كتاب_الرياضيات_الثالث_المتوسط_2026_مع_التقليص_الجديد.pdf",
    "stage": "المرحلة المتوسطة",
    "grade": "الصف الثالث",
    "subject": "الرياضيات",
    "typeOrPart": "",
    "driveId": "1rRJEpOhVHOULUhe3gtsw5B1c_eP4AEOo",
    "viewUrl": "https://drive.google.com/file/d/1rRJEpOhVHOULUhe3gtsw5B1c_eP4AEOo/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1rRJEpOhVHOULUhe3gtsw5B1c_eP4AEOo"
  },
  {
    "fileName": "كتاب الفيزياء الثالث المتوسط.pdf",
    "stage": "المرحلة المتوسطة",
    "grade": "الصف الثالث",
    "subject": "الفيزياء",
    "typeOrPart": "",
    "driveId": "13qH-5mTnr3lZxY6TEaUd0-BLLO1X7kJt",
    "viewUrl": "https://drive.google.com/file/d/13qH-5mTnr3lZxY6TEaUd0-BLLO1X7kJt/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=13qH-5mTnr3lZxY6TEaUd0-BLLO1X7kJt"
  },
  {
    "fileName": "كتاب الكيمياء الثالث المتوسط.pdf",
    "stage": "المرحلة المتوسطة",
    "grade": "الصف الثالث",
    "subject": "الكيمياء",
    "typeOrPart": "",
    "driveId": "1JrJHiFg_CctZz9I2qJU1B6806CYJjgNZ",
    "viewUrl": "https://drive.google.com/file/d/1JrJHiFg_CctZz9I2qJU1B6806CYJjgNZ/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1JrJHiFg_CctZz9I2qJU1B6806CYJjgNZ"
  },
  {
    "fileName": "كتاب_الانكليزي_الطالب_الثالث_المتوسط.pdf",
    "stage": "المرحلة المتوسطة",
    "grade": "الصف الثالث",
    "subject": "اللغة الإنجليزية",
    "typeOrPart": "كتاب الطالب",
    "driveId": "1ITZzbXoQRfOB6xdJ1g4Xk5qgRuXwhJvU",
    "viewUrl": "https://drive.google.com/file/d/1ITZzbXoQRfOB6xdJ1g4Xk5qgRuXwhJvU/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1ITZzbXoQRfOB6xdJ1g4Xk5qgRuXwhJvU"
  },
  {
    "fileName": "كتاب_الانكليزي_النشاط_الثالث_المتوسط.pdf",
    "stage": "المرحلة المتوسطة",
    "grade": "الصف الثالث",
    "subject": "اللغة الإنجليزية",
    "typeOrPart": "كتاب النشاط",
    "driveId": "1MLmWCVDSLJNrvpWVnyP_eqS-ULtlzR9K",
    "viewUrl": "https://drive.google.com/file/d/1MLmWCVDSLJNrvpWVnyP_eqS-ULtlzR9K/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1MLmWCVDSLJNrvpWVnyP_eqS-ULtlzR9K"
  },
  {
    "fileName": "كتاب_اللغة_العربية_الصف_الثالث_متوسط2026_1.pdf",
    "stage": "المرحلة المتوسطة",
    "grade": "الصف الثالث",
    "subject": "اللغة العربية",
    "typeOrPart": "",
    "driveId": "1Zad-F3N0PTDIPL9s106l9kwLkt-jD5UZ",
    "viewUrl": "https://drive.google.com/file/d/1Zad-F3N0PTDIPL9s106l9kwLkt-jD5UZ/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1Zad-F3N0PTDIPL9s106l9kwLkt-jD5UZ"
  },
  {
    "fileName": "كتاب_اللغة_العربية_الصف_الثالث_متوسط2026.pdf",
    "stage": "المرحلة المتوسطة",
    "grade": "الصف الثالث",
    "subject": "اللغة العربية",
    "typeOrPart": "",
    "driveId": "1FXolWIUzzqvplOYgRV0nvxkze7OVqaS1",
    "viewUrl": "https://drive.google.com/file/d/1FXolWIUzzqvplOYgRV0nvxkze7OVqaS1/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1FXolWIUzzqvplOYgRV0nvxkze7OVqaS1"
  },
  {
    "fileName": "كتاب الاجتماعيات الثاني المتوسط.pdf",
    "stage": "المرحلة المتوسطة",
    "grade": "الصف الثاني",
    "subject": "الاجتماعيات",
    "typeOrPart": "",
    "driveId": "13od5vh8y69GDK7bpuaGtaGHisQeo1Eqm",
    "viewUrl": "https://drive.google.com/file/d/13od5vh8y69GDK7bpuaGtaGHisQeo1Eqm/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=13od5vh8y69GDK7bpuaGtaGHisQeo1Eqm"
  },
  {
    "fileName": "كتاب الاحياء الثاني المتوسط.pdf",
    "stage": "المرحلة المتوسطة",
    "grade": "الصف الثاني",
    "subject": "الأحياء",
    "typeOrPart": "",
    "driveId": "1bzhAaE9aYNWEod7v5wG6Pd8mEcoQNDNe",
    "viewUrl": "https://drive.google.com/file/d/1bzhAaE9aYNWEod7v5wG6Pd8mEcoQNDNe/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1bzhAaE9aYNWEod7v5wG6Pd8mEcoQNDNe"
  },
  {
    "fileName": "كتاب_التربية_الاخلاقية_الثاني_المتوسط.pdf",
    "stage": "المرحلة المتوسطة",
    "grade": "الصف الثاني",
    "subject": "التربية الأخلاقية",
    "typeOrPart": "",
    "driveId": "1B4PmftbEE2Fuu63ESrYMQGRKPabeiBrR",
    "viewUrl": "https://drive.google.com/file/d/1B4PmftbEE2Fuu63ESrYMQGRKPabeiBrR/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1B4PmftbEE2Fuu63ESrYMQGRKPabeiBrR"
  },
  {
    "fileName": "كتاب الاسلامية الثاني المتوسط.pdf",
    "stage": "المرحلة المتوسطة",
    "grade": "الصف الثاني",
    "subject": "التربية الإسلامية",
    "typeOrPart": "",
    "driveId": "1A5Kod8VsqkrZii0HIPZpvBBLnuEC_NNu",
    "viewUrl": "https://drive.google.com/file/d/1A5Kod8VsqkrZii0HIPZpvBBLnuEC_NNu/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1A5Kod8VsqkrZii0HIPZpvBBLnuEC_NNu"
  },
  {
    "fileName": "كتاب الحاسوب الثاني المتوسط.pdf",
    "stage": "المرحلة المتوسطة",
    "grade": "الصف الثاني",
    "subject": "الحاسوب",
    "typeOrPart": "",
    "driveId": "1HG6qNzAhXhfF2lx7Y_jY9Zk0QNIpl65I",
    "viewUrl": "https://drive.google.com/file/d/1HG6qNzAhXhfF2lx7Y_jY9Zk0QNIpl65I/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1HG6qNzAhXhfF2lx7Y_jY9Zk0QNIpl65I"
  },
  {
    "fileName": "كتاب الرياضيات الثاني المتوسط.pdf",
    "stage": "المرحلة المتوسطة",
    "grade": "الصف الثاني",
    "subject": "الرياضيات",
    "typeOrPart": "",
    "driveId": "1Kx59aOLBPM9sf0YkFNW01MzKkX83Y7n9",
    "viewUrl": "https://drive.google.com/file/d/1Kx59aOLBPM9sf0YkFNW01MzKkX83Y7n9/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1Kx59aOLBPM9sf0YkFNW01MzKkX83Y7n9"
  },
  {
    "fileName": "كتاب الفيزياء الثاني المتوسط.pdf",
    "stage": "المرحلة المتوسطة",
    "grade": "الصف الثاني",
    "subject": "الفيزياء",
    "typeOrPart": "",
    "driveId": "1M-PX802_ijL7rILOrpAVXltMAs_z2mJp",
    "viewUrl": "https://drive.google.com/file/d/1M-PX802_ijL7rILOrpAVXltMAs_z2mJp/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1M-PX802_ijL7rILOrpAVXltMAs_z2mJp"
  },
  {
    "fileName": "كتاب الكيمياء الثاني المتوسط.pdf",
    "stage": "المرحلة المتوسطة",
    "grade": "الصف الثاني",
    "subject": "الكيمياء",
    "typeOrPart": "",
    "driveId": "1elUAt1ZZVwGjBycjxRu0e3L5DUHeCwtQ",
    "viewUrl": "https://drive.google.com/file/d/1elUAt1ZZVwGjBycjxRu0e3L5DUHeCwtQ/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1elUAt1ZZVwGjBycjxRu0e3L5DUHeCwtQ"
  },
  {
    "fileName": "كتاب_الانكليزي_الطالب_الثاني_المتوسط.pdf",
    "stage": "المرحلة المتوسطة",
    "grade": "الصف الثاني",
    "subject": "اللغة الإنجليزية",
    "typeOrPart": "كتاب الطالب",
    "driveId": "11X-4Sk60VbOtw6PWtvNFiZeNC-9904kS",
    "viewUrl": "https://drive.google.com/file/d/11X-4Sk60VbOtw6PWtvNFiZeNC-9904kS/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=11X-4Sk60VbOtw6PWtvNFiZeNC-9904kS"
  },
  {
    "fileName": "كتاب_الانكليزي_النشاط_الثاني_المتوسط.pdf",
    "stage": "المرحلة المتوسطة",
    "grade": "الصف الثاني",
    "subject": "اللغة الإنجليزية",
    "typeOrPart": "كتاب النشاط",
    "driveId": "1uMHYx5A8DFLYtwHHFbSNb_VJLH1BK6GB",
    "viewUrl": "https://drive.google.com/file/d/1uMHYx5A8DFLYtwHHFbSNb_VJLH1BK6GB/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1uMHYx5A8DFLYtwHHFbSNb_VJLH1BK6GB"
  },
  {
    "fileName": "كتاب_العربي_الثاني_المتوسط_الجزء_الثاني.pdf",
    "stage": "المرحلة المتوسطة",
    "grade": "الصف الثاني",
    "subject": "اللغة العربية",
    "typeOrPart": "الجزء الثاني",
    "driveId": "1ncWTe3m8o-Lnt0d2CQLs7vXk60n6svTP",
    "viewUrl": "https://drive.google.com/file/d/1ncWTe3m8o-Lnt0d2CQLs7vXk60n6svTP/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1ncWTe3m8o-Lnt0d2CQLs7vXk60n6svTP"
  },
  {
    "fileName": "كتاب_الطالب_الفرنسي_الثاني_متوسط_المنهج_الجديد.pdf",
    "stage": "المرحلة المتوسطة",
    "grade": "الصف الثاني",
    "subject": "اللغة الفرنسية",
    "typeOrPart": "كتاب الطالب",
    "driveId": "1wQUw1TKEryHv-uriYpqhtOgrlbqREJAz",
    "viewUrl": "https://drive.google.com/file/d/1wQUw1TKEryHv-uriYpqhtOgrlbqREJAz/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1wQUw1TKEryHv-uriYpqhtOgrlbqREJAz"
  },
  {
    "fileName": "كتاب_الفرنسي_المرحلة_المتوسطة_المنهج_الجديد.pdf",
    "stage": "المرحلة المتوسطة",
    "grade": "كتب عامة",
    "subject": "اللغة الفرنسية",
    "typeOrPart": "",
    "driveId": "1H6NhG9CRXri37WfdHItchTI6WCMoQC8T",
    "viewUrl": "https://drive.google.com/file/d/1H6NhG9CRXri37WfdHItchTI6WCMoQC8T/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1H6NhG9CRXri37WfdHItchTI6WCMoQC8T"
  },
  {
    "fileName": "حلول_وترجمة_الوحدة_الاولى_المنهج_الجديد_كتاب_الطالب_وكتاب_النشاط.pdf",
    "stage": "غير محددة",
    "grade": "الصف الأول",
    "subject": "حلول وترجمة",
    "typeOrPart": "كتاب النشاط",
    "driveId": "1tqG4zqXQsvKGS-ue5BR8LewpW4PK51ci",
    "viewUrl": "https://drive.google.com/file/d/1tqG4zqXQsvKGS-ue5BR8LewpW4PK51ci/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1tqG4zqXQsvKGS-ue5BR8LewpW4PK51ci"
  },
  {
    "fileName": "كتاب الاحياء المنقح 2025.pdf",
    "stage": "غير محددة",
    "grade": "غير محدد",
    "subject": "الأحياء",
    "typeOrPart": "",
    "driveId": "1ojKQyvmfUCn2SsuVf2gRKJFk8d1XCM8B",
    "viewUrl": "https://drive.google.com/file/d/1ojKQyvmfUCn2SsuVf2gRKJFk8d1XCM8B/view",
    "downloadUrl": "https://drive.google.com/uc?export=download&id=1ojKQyvmfUCn2SsuVf2gRKJFk8d1XCM8B"
  }
];

/**
 * البحث عن رابط عرض أو تنزيل PDF لمادة وصف معين
 */
export function findPdfLink(params: {
  subjectName: string;
  grade: string;
  stage?: string;
  typeOrPart?: string;
}): CurriculumPdfLink | undefined {
  const normSubj = params.subjectName.trim();
  const normGrade = params.grade.trim();

  // 1. مطابقة مباشرة
  for (const item of PDF_CURRICULUM_CATALOG) {
    const matchGrade = item.grade.includes(normGrade) || normGrade.includes(item.grade);
    const matchSubj = item.subject.includes(normSubj) || normSubj.includes(item.subject);
    if (matchGrade && matchSubj) {
      if (params.typeOrPart && item.typeOrPart) {
        if (item.typeOrPart.includes(params.typeOrPart) || params.typeOrPart.includes(item.typeOrPart)) {
          return item;
        }
      } else {
        return item;
      }
    }
  }

  // 2. مطابقة بالاسم
  return PDF_CURRICULUM_CATALOG.find(
    item => item.fileName.includes(normSubj) && (item.fileName.includes(normGrade) || item.grade.includes(normGrade)),
  );
}

/**
 * استخراج رابط العرض المباشر في المتصفح أو Webview
 */
export function getPdfViewUrl(subjectName: string, grade: string): string | null {
  const link = findPdfLink({ subjectName, grade });
  return link?.viewUrl ?? null;
}

/**
 * استخراج رابط التنزيل المباشر
 */
export function getPdfDownloadUrl(subjectName: string, grade: string): string | null {
  const link = findPdfLink({ subjectName, grade });
  return link?.downloadUrl ?? null;
}
