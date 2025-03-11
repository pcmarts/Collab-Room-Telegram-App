import pandas as pd
import os

# Read the CSV file
df = pd.read_csv('database_schema.csv')

# Create a new Excel writer object
writer = pd.ExcelWriter('database_schema.xlsx', engine='xlsxwriter')

# Get unique table names
tables = df['Table'].unique()

# Create a worksheet for overall schema
overall_df = df.copy()
overall_df.to_excel(writer, sheet_name='Complete Schema', index=False)

# Create a worksheet for each table
for table in tables:
    table_df = df[df['Table'] == table]
    table_df.to_excel(writer, sheet_name=table[:31], index=False)  # Excel sheet names have 31 char limit

# Format the Excel file
workbook = writer.book

# Create format objects
header_format = workbook.add_format({
    'bold': True,
    'text_wrap': True,
    'valign': 'top',
    'border': 1,
    'bg_color': '#D7E4BC'
})

cell_format = workbook.add_format({
    'text_wrap': True,
    'valign': 'top',
    'border': 1
})

# Apply formats to each worksheet
for worksheet in writer.sheets.values():
    worksheet.set_column('A:A', 25)  # Table column width
    worksheet.set_column('B:B', 30)  # Column name width
    worksheet.set_column('C:C', 15)  # Type column width
    worksheet.set_column('D:D', 20)  # References column width
    worksheet.set_column('E:E', 20)  # Constraints column width
    worksheet.set_column('F:F', 50)  # Description column width
    
    # Use the header format for the first row
    for col_num, value in enumerate(df.columns.values):
        worksheet.write(0, col_num, value, header_format)
    
    # Set autofilter
    worksheet.autofilter(0, 0, len(df), len(df.columns) - 1)

# Save the Excel file
writer.close()

print("Excel file has been created: database_schema.xlsx")