# -*- coding: utf-8 -*-
import zipfile
import xml.etree.ElementTree as ET
import json
import os
import io

EXCEL_FILE = os.path.join(os.path.dirname(__file__), '..', 'فهرس_المناهج_وروابط_التحميل.xlsx')

def read_xlsx(file_path):
    with zipfile.ZipFile(file_path, 'r') as z:
        # 1. Read shared strings
        shared_strings = []
        if 'xl/sharedStrings.xml' in z.namelist():
            tree = ET.fromstring(z.read('xl/sharedStrings.xml'))
            # namespace
            ns = {'main': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
            for si in tree.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}si'):
                texts = [t.text for t in si.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t') if t.text]
                shared_strings.append(''.join(texts))

        # 2. Read sheet1.xml
        sheet_tree = ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
        rows_data = []

        for row in sheet_tree.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row'):
            row_cells = {}
            for c in row.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c'):
                r_ref = c.attrib.get('r', '')
                col_letter = ''.join([ch for ch in r_ref if ch.isalpha()])
                c_type = c.attrib.get('t', '')
                v_tag = c.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
                if v_tag is not None and v_tag.text is not None:
                    val = v_tag.text
                    if c_type == 's':
                        val = shared_strings[int(val)] if int(val) < len(shared_strings) else val
                    row_cells[col_letter] = val
                else:
                    # check inlineStr
                    is_tag = c.find('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t')
                    if is_tag is not None and is_tag.text:
                        row_cells[col_letter] = is_tag.text
            if row_cells:
                rows_data.append(row_cells)

        return rows_data

def main():
    print(f"Reading Excel: {EXCEL_FILE}")
    rows = read_xlsx(EXCEL_FILE)
    print(f"Total Rows: {len(rows)}")

    # Print header and first 10 rows
    for i, r in enumerate(rows[:15]):
        print(f"Row {i+1}: {r}")

    # Write to a JSON file for easy processing in Node.js / TypeScript
    output_json = os.path.join(os.path.dirname(__file__), '..', 'json_books', 'curriculum_pdf_links.json')
    with open(output_json, 'w', encoding='utf-8') as f:
        json.dump(rows, f, ensure_ascii=False, indent=2)
    print(f"Saved to: {output_json}")

if __name__ == '__main__':
    main()
