import pandas as pd
import os
import numpy as np

# Define the database structure with more details
database_structure = {
    "tables": {
        "users": {
            "description": "Core users table that stores all registered users",
            "columns": [
                {"name": "id", "type": "uuid", "pk": True, "description": "Unique user identifier"},
                {"name": "telegram_id", "type": "text", "unique": True, "nullable": False, "description": "Telegram user ID"},
                {"name": "first_name", "type": "text", "nullable": False, "description": "User's first name"},
                {"name": "last_name", "type": "text", "nullable": True, "description": "User's last name (optional)"},
                {"name": "handle", "type": "text", "nullable": False, "description": "User's handle/username"},
                {"name": "linkedin_url", "type": "text", "nullable": True, "description": "LinkedIn profile URL"},
                {"name": "email", "type": "text", "nullable": True, "description": "User's email address"},
                {"name": "referral_code", "type": "text", "nullable": True, "description": "Referral code"},
                {"name": "twitter_url", "type": "text", "nullable": True, "description": "Twitter profile URL"},
                {"name": "twitter_followers", "type": "text", "nullable": True, "description": "Number of Twitter followers"},
                {"name": "is_approved", "type": "boolean", "default": "false", "description": "Approval status"},
                {"name": "is_admin", "type": "boolean", "default": "false", "description": "Admin status"},
                {"name": "applied_at", "type": "timestamp", "description": "Application timestamp"},
                {"name": "created_at", "type": "timestamp", "default": "NOW()", "description": "Creation timestamp"}
            ],
            "indexes": [
                {"name": "users_telegram_id_idx", "columns": ["telegram_id"], "unique": True}
            ]
        },
        "companies": {
            "description": "Companies associated with users",
            "columns": [
                {"name": "id", "type": "uuid", "pk": True, "description": "Unique company identifier"},
                {"name": "user_id", "type": "uuid", "nullable": False, "fk": "users.id", "ondelete": "cascade", "description": "Associated user"},
                {"name": "name", "type": "text", "nullable": False, "description": "Company name"},
                {"name": "short_description", "type": "text", "nullable": True, "description": "Brief company description"},
                {"name": "long_description", "type": "text", "nullable": True, "description": "Detailed company description"},
                {"name": "website", "type": "text", "nullable": False, "description": "Company website"},
                {"name": "job_title", "type": "text", "nullable": False, "description": "User's role in the company"},
                {"name": "twitter_handle", "type": "text", "nullable": True, "description": "Company Twitter handle"},
                {"name": "twitter_followers", "type": "text", "nullable": True, "description": "Company Twitter followers count"},
                {"name": "linkedin_url", "type": "text", "nullable": True, "description": "Company LinkedIn URL"},
                {"name": "funding_stage", "type": "text", "nullable": False, "description": "Company funding stage"},
                {"name": "has_token", "type": "boolean", "default": "false", "description": "Whether company has a token"},
                {"name": "token_ticker", "type": "text", "nullable": True, "description": "Token ticker symbol"},
                {"name": "blockchain_networks", "type": "text[]", "nullable": True, "description": "Blockchain networks"},
                {"name": "tags", "type": "text[]", "nullable": True, "description": "Company tags"},
                {"name": "created_at", "type": "timestamp", "default": "NOW()", "description": "Creation timestamp"}
            ],
            "indexes": [
                {"name": "companies_user_id_idx", "columns": ["user_id"]}
            ]
        },
        "events": {
            "description": "Blockchain industry events and conferences",
            "columns": [
                {"name": "id", "type": "uuid", "pk": True, "description": "Unique event identifier"},
                {"name": "name", "type": "text", "nullable": False, "description": "Event name"},
                {"name": "start_date", "type": "timestamp", "nullable": False, "description": "Event start date"},
                {"name": "end_date", "type": "timestamp", "nullable": False, "description": "Event end date"},
                {"name": "city", "type": "text", "nullable": False, "description": "Event location"},
                {"name": "created_at", "type": "timestamp", "default": "NOW()", "description": "Creation timestamp"}
            ],
            "indexes": [
                {"name": "events_date_idx", "columns": ["start_date", "end_date"]}
            ]
        },
        "user_events": {
            "description": "Junction table for users attending events",
            "columns": [
                {"name": "id", "type": "uuid", "pk": True, "description": "Unique user-event mapping"},
                {"name": "user_id", "type": "uuid", "nullable": False, "fk": "users.id", "ondelete": "cascade", "description": "User reference"},
                {"name": "event_id", "type": "uuid", "nullable": False, "fk": "events.id", "ondelete": "cascade", "description": "Event reference"},
                {"name": "created_at", "type": "timestamp", "default": "NOW()", "description": "Creation timestamp"}
            ],
            "indexes": [
                {"name": "user_events_user_id_idx", "columns": ["user_id"]},
                {"name": "user_events_event_id_idx", "columns": ["event_id"]},
                {"name": "user_events_unique_idx", "columns": ["user_id", "event_id"], "unique": True}
            ]
        },
        "notification_preferences": {
            "description": "User notification preferences",
            "columns": [
                {"name": "id", "type": "uuid", "pk": True, "description": "Unique preferences identifier"},
                {"name": "user_id", "type": "uuid", "nullable": False, "fk": "users.id", "ondelete": "cascade", "description": "User reference"},
                {"name": "notifications_enabled", "type": "boolean", "default": "true", "description": "Whether notifications are enabled"},
                {"name": "notification_frequency", "type": "text", "nullable": False, "default": "'Daily'", "description": "Notification frequency"},
                {"name": "created_at", "type": "timestamp", "default": "NOW()", "description": "Creation timestamp"}
            ],
            "indexes": [
                {"name": "notification_preferences_user_id_idx", "columns": ["user_id"], "unique": True}
            ]
        },
        "marketing_preferences": {
            "description": "User marketing collaboration preferences",
            "columns": [
                {"name": "id", "type": "uuid", "pk": True, "description": "Unique preferences identifier"},
                {"name": "user_id", "type": "uuid", "nullable": False, "fk": "users.id", "ondelete": "cascade", "description": "User reference"},
                {"name": "collabs_to_discover", "type": "text[]", "nullable": True, "description": "Collaboration types to discover"},
                {"name": "collabs_to_host", "type": "text[]", "nullable": True, "description": "Collaboration types to host"},
                {"name": "twitter_collabs", "type": "text[]", "nullable": True, "description": "Twitter collaboration types"},
                {"name": "filtered_marketing_topics", "type": "text[]", "nullable": True, "description": "Filtered marketing topics/tags"},
                {"name": "discovery_filter_enabled", "type": "boolean", "default": "false", "description": "Whether discovery filter is enabled"},
                {"name": "discovery_filter_topics_enabled", "type": "boolean", "default": "false", "description": "Whether topic filter is enabled"},
                {"name": "discovery_filter_company_followers_enabled", "type": "boolean", "default": "false", "description": "Whether company followers filter is enabled"},
                {"name": "discovery_filter_user_followers_enabled", "type": "boolean", "default": "false", "description": "Whether user followers filter is enabled"},
                {"name": "discovery_filter_funding_stages_enabled", "type": "boolean", "default": "false", "description": "Whether funding stage filter is enabled"},
                {"name": "discovery_filter_token_status_enabled", "type": "boolean", "default": "false", "description": "Whether token status filter is enabled"},
                {"name": "discovery_filter_company_sectors_enabled", "type": "boolean", "default": "false", "description": "Whether company sector filter is enabled"},
                {"name": "created_at", "type": "timestamp", "default": "NOW()", "description": "Creation timestamp"}
            ],
            "indexes": [
                {"name": "marketing_preferences_user_id_idx", "columns": ["user_id"], "unique": True}
            ]
        },
        "conference_preferences": {
            "description": "User conference coffee matching preferences",
            "columns": [
                {"name": "id", "type": "uuid", "pk": True, "description": "Unique preferences identifier"},
                {"name": "user_id", "type": "uuid", "nullable": False, "fk": "users.id", "ondelete": "cascade", "description": "User reference"},
                {"name": "coffee_match_enabled", "type": "boolean", "default": "false", "description": "Whether coffee match is enabled"},
                {"name": "coffee_match_company_sectors", "type": "text[]", "nullable": True, "description": "Company sectors for coffee matching"},
                {"name": "coffee_match_company_followers", "type": "text", "nullable": True, "description": "Min company followers for coffee matching"},
                {"name": "coffee_match_user_followers", "type": "text", "nullable": True, "description": "Min user followers for coffee matching"},
                {"name": "coffee_match_funding_stages", "type": "text[]", "nullable": True, "description": "Funding stages for coffee matching"},
                {"name": "coffee_match_token_status", "type": "boolean", "default": "false", "description": "Token status for coffee matching"},
                {"name": "filtered_conference_sectors", "type": "text[]", "nullable": True, "description": "Filtered conference sectors"},
                {"name": "coffee_match_filter_company_sectors_enabled", "type": "boolean", "default": "false", "description": "Whether company sector filter is enabled"},
                {"name": "coffee_match_filter_company_followers_enabled", "type": "boolean", "default": "false", "description": "Whether company followers filter is enabled"},
                {"name": "coffee_match_filter_user_followers_enabled", "type": "boolean", "default": "false", "description": "Whether user followers filter is enabled"},
                {"name": "coffee_match_filter_funding_stages_enabled", "type": "boolean", "default": "false", "description": "Whether funding stage filter is enabled"},
                {"name": "coffee_match_filter_token_status_enabled", "type": "boolean", "default": "false", "description": "Whether token status filter is enabled"},
                {"name": "created_at", "type": "timestamp", "default": "NOW()", "description": "Creation timestamp"}
            ],
            "indexes": [
                {"name": "conference_preferences_user_id_idx", "columns": ["user_id"], "unique": True}
            ]
        },
        "collaborations": {
            "description": "Marketing collaboration opportunities",
            "columns": [
                {"name": "id", "type": "uuid", "pk": True, "description": "Unique collaboration identifier"},
                {"name": "creator_id", "type": "uuid", "nullable": False, "fk": "users.id", "ondelete": "cascade", "description": "Creator user reference"},
                {"name": "collab_type", "type": "text", "nullable": False, "description": "Collaboration type"},
                {"name": "title", "type": "text", "nullable": False, "description": "Collaboration title"},
                {"name": "description", "type": "text", "nullable": False, "description": "Collaboration description"},
                {"name": "status", "type": "text", "nullable": False, "default": "'active'", "description": "Collaboration status"},
                {"name": "topics", "type": "text[]", "nullable": True, "description": "Collaboration topics"},
                {"name": "filter_company_sectors_enabled", "type": "boolean", "default": "false", "description": "Whether company sector filter is enabled"},
                {"name": "filter_company_followers_enabled", "type": "boolean", "default": "false", "description": "Whether company followers filter is enabled"},
                {"name": "filter_user_followers_enabled", "type": "boolean", "default": "false", "description": "Whether user followers filter is enabled"},
                {"name": "filter_funding_stages_enabled", "type": "boolean", "default": "false", "description": "Whether funding stage filter is enabled"},
                {"name": "filter_token_status_enabled", "type": "boolean", "default": "false", "description": "Whether token status filter is enabled"},
                {"name": "filter_blockchain_networks_enabled", "type": "boolean", "default": "false", "description": "Whether blockchain networks filter is enabled"},
                {"name": "required_company_sectors", "type": "text[]", "nullable": True, "description": "Required company sectors"},
                {"name": "required_funding_stages", "type": "text[]", "nullable": True, "description": "Required funding stages"},
                {"name": "required_token_status", "type": "boolean", "nullable": True, "description": "Required token status"},
                {"name": "required_blockchain_networks", "type": "text[]", "nullable": True, "description": "Required blockchain networks"},
                {"name": "min_company_followers", "type": "text", "nullable": True, "description": "Minimum company followers"},
                {"name": "min_user_followers", "type": "text", "nullable": True, "description": "Minimum user followers"},
                {"name": "is_free_collab", "type": "boolean", "nullable": False, "default": "true", "description": "Whether it's a free collaboration"},
                {"name": "details", "type": "jsonb", "nullable": False, "description": "Type-specific collaboration details"},
                {"name": "date_type", "type": "text", "nullable": False, "description": "Date preference type"},
                {"name": "specific_date", "type": "text", "nullable": True, "description": "Specific date if required"},
                {"name": "created_at", "type": "timestamp", "default": "NOW()", "description": "Creation timestamp"},
                {"name": "updated_at", "type": "timestamp", "default": "NOW()", "description": "Update timestamp"}
            ],
            "indexes": [
                {"name": "collaborations_creator_id_idx", "columns": ["creator_id"]},
                {"name": "collaborations_status_idx", "columns": ["status"]},
                {"name": "collaborations_collab_type_idx", "columns": ["collab_type"]}
            ]
        },
        "collab_applications": {
            "description": "Applications to collaborations",
            "columns": [
                {"name": "id", "type": "uuid", "pk": True, "description": "Unique application identifier"},
                {"name": "collaboration_id", "type": "uuid", "nullable": False, "fk": "collaborations.id", "ondelete": "cascade", "description": "Collaboration reference"},
                {"name": "applicant_id", "type": "uuid", "nullable": False, "fk": "users.id", "ondelete": "cascade", "description": "Applicant user reference"},
                {"name": "status", "type": "text", "nullable": False, "default": "'pending'", "description": "Application status"},
                {"name": "message", "type": "text", "nullable": True, "description": "Application message"},
                {"name": "created_at", "type": "timestamp", "default": "NOW()", "description": "Creation timestamp"},
                {"name": "updated_at", "type": "timestamp", "default": "NOW()", "description": "Update timestamp"}
            ],
            "indexes": [
                {"name": "collab_applications_collaboration_id_idx", "columns": ["collaboration_id"]},
                {"name": "collab_applications_applicant_id_idx", "columns": ["applicant_id"]},
                {"name": "collab_applications_status_idx", "columns": ["status"]}
            ]
        },
        "collab_notifications": {
            "description": "Notifications for collaboration activities",
            "columns": [
                {"name": "id", "type": "uuid", "pk": True, "description": "Unique notification identifier"},
                {"name": "user_id", "type": "uuid", "nullable": False, "fk": "users.id", "ondelete": "cascade", "description": "User reference"},
                {"name": "collaboration_id", "type": "uuid", "nullable": False, "fk": "collaborations.id", "ondelete": "cascade", "description": "Collaboration reference"},
                {"name": "application_id", "type": "uuid", "nullable": True, "fk": "collab_applications.id", "ondelete": "cascade", "description": "Application reference (optional)"},
                {"name": "type", "type": "text", "nullable": False, "description": "Notification type"},
                {"name": "content", "type": "text", "nullable": False, "description": "Notification content"},
                {"name": "is_read", "type": "boolean", "default": "false", "description": "Whether notification is read"},
                {"name": "is_sent", "type": "boolean", "default": "false", "description": "Whether notification is sent"},
                {"name": "created_at", "type": "timestamp", "default": "NOW()", "description": "Creation timestamp"}
            ],
            "indexes": [
                {"name": "collab_notifications_user_id_idx", "columns": ["user_id"]},
                {"name": "collab_notifications_collaboration_id_idx", "columns": ["collaboration_id"]},
                {"name": "collab_notifications_application_id_idx", "columns": ["application_id"]},
                {"name": "collab_notifications_is_read_idx", "columns": ["is_read"]}
            ]
        }
    }
}

# Create a DataFrame for the database schema
table_rows = []
for table_name, table_info in database_structure["tables"].items():
    for column in table_info["columns"]:
        constraints = []
        if column.get("pk"):
            constraints.append("PRIMARY KEY")
        if column.get("unique"):
            constraints.append("UNIQUE")
        if not column.get("nullable", True):
            constraints.append("NOT NULL")
        if column.get("default"):
            constraints.append(f"DEFAULT {column.get('default')}")
        if column.get("fk"):
            fk_parts = column.get("fk").split(".")
            ref_table = fk_parts[0]
            ref_column = fk_parts[1]
            on_delete = column.get("ondelete", "")
            constraints.append(f"REFERENCES {ref_table}({ref_column}){' ON DELETE ' + on_delete if on_delete else ''}")
        
        table_rows.append({
            "Table": table_name,
            "Column": column["name"],
            "Type": column["type"],
            "Constraints": ", ".join(constraints),
            "Description": column["description"]
        })

# Create a DataFrame for the indexes
index_rows = []
for table_name, table_info in database_structure["tables"].items():
    if "indexes" in table_info:
        for index in table_info["indexes"]:
            index_type = "UNIQUE INDEX" if index.get("unique") else "INDEX"
            index_rows.append({
                "Table": table_name,
                "Index Name": index["name"],
                "Columns": ", ".join(index["columns"]),
                "Type": index_type
            })

# Create a DataFrame for the tables
table_summary_rows = []
for table_name, table_info in database_structure["tables"].items():
    table_summary_rows.append({
        "Table": table_name,
        "Description": table_info["description"],
        "Columns": len(table_info["columns"]),
        "Indexes": len(table_info.get("indexes", []))
    })

# Create DataFrames
df_schema = pd.DataFrame(table_rows)
df_indexes = pd.DataFrame(index_rows)
df_tables = pd.DataFrame(table_summary_rows)

# Create a new Excel writer object
writer = pd.ExcelWriter('collab_room_database_schema.xlsx', engine='xlsxwriter')

# Write the DataFrames to the Excel file
df_tables.to_excel(writer, sheet_name='Tables Overview', index=False)
df_schema.to_excel(writer, sheet_name='Database Schema', index=False)
df_indexes.to_excel(writer, sheet_name='Indexes', index=False)

# Add a sheet for each table
for table_name, table_info in database_structure["tables"].items():
    table_df = df_schema[df_schema['Table'] == table_name].copy()
    sheet_name = table_name[:31]  # Excel sheets have a 31 character limit
    table_df.to_excel(writer, sheet_name=sheet_name, index=False)

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

title_format = workbook.add_format({
    'bold': True,
    'font_size': 14,
    'valign': 'top'
})

# Format each worksheet
for sheet_name, worksheet in writer.sheets.items():
    if sheet_name == 'Tables Overview':
        worksheet.set_column('A:A', 30)  # Table column width
        worksheet.set_column('B:B', 60)  # Description column width
        worksheet.set_column('C:D', 15)  # Other columns width
    elif sheet_name == 'Indexes':
        worksheet.set_column('A:A', 30)  # Table column width
        worksheet.set_column('B:B', 40)  # Index name column width
        worksheet.set_column('C:C', 40)  # Columns column width
        worksheet.set_column('D:D', 15)  # Type column width
    else:  # Database Schema and individual tables
        worksheet.set_column('A:A', 25)  # Table column width
        worksheet.set_column('B:B', 30)  # Column name column width
        worksheet.set_column('C:C', 15)  # Type column width
        worksheet.set_column('D:D', 50)  # Constraints column width
        worksheet.set_column('E:E', 60)  # Description column width
    
    # Apply the header format to the first row
    for col_num, value in enumerate(df_schema.columns.values if sheet_name != 'Tables Overview' and sheet_name != 'Indexes' else 
                                   (df_tables.columns.values if sheet_name == 'Tables Overview' else df_indexes.columns.values)):
        if col_num < len(df_schema.columns if sheet_name != 'Tables Overview' and sheet_name != 'Indexes' else 
                       (df_tables.columns if sheet_name == 'Tables Overview' else df_indexes.columns)):
            worksheet.write(0, col_num, value, header_format)
    
    # Set autofilter on all sheets
    if sheet_name == 'Tables Overview':
        worksheet.autofilter(0, 0, len(df_tables), len(df_tables.columns) - 1)
    elif sheet_name == 'Indexes':
        worksheet.autofilter(0, 0, len(df_indexes), len(df_indexes.columns) - 1)
    else:
        max_rows = len(df_schema) if sheet_name == 'Database Schema' else len(df_schema[df_schema['Table'] == sheet_name])
        worksheet.autofilter(0, 0, max_rows, len(df_schema.columns) - 1)

# Add a diagram worksheet with relationships
diagram_sheet = workbook.add_worksheet('ERD Notes')
diagram_sheet.set_column('A:A', 120)

# Get relationships from the database structure
relationships = []
for table_name, table_info in database_structure["tables"].items():
    for column in table_info["columns"]:
        if column.get("fk"):
            fk_parts = column.get("fk").split(".")
            ref_table = fk_parts[0]
            ref_column = fk_parts[1]
            on_delete = column.get("ondelete", "")
            relationships.append({
                "from_table": table_name,
                "from_column": column["name"],
                "to_table": ref_table,
                "to_column": ref_column,
                "on_delete": on_delete
            })

# Add relationships to the diagram sheet
diagram_sheet.write(0, 0, "Entity-Relationship Diagram Notes", title_format)
diagram_sheet.write(1, 0, "The following relationships exist between tables:")

for i, rel in enumerate(relationships):
    diagram_sheet.write(
        i + 3, 0, 
        f"{rel['from_table']}.{rel['from_column']} -> {rel['to_table']}.{rel['to_column']}" + 
        (f" (ON DELETE {rel['on_delete']})" if rel['on_delete'] else "")
    )

# Add notes about the database
notes_row = len(relationships) + 5
diagram_sheet.write(notes_row, 0, "Database Implementation Notes:", title_format)
diagram_sheet.write(notes_row + 1, 0, "1. All IDs are UUID type for security and distributed system compatibility.")
diagram_sheet.write(notes_row + 2, 0, "2. Timestamps include timezone information (with timezone = true).")
diagram_sheet.write(notes_row + 3, 0, "3. Most foreign key constraints include 'ON DELETE CASCADE' to maintain referential integrity.")
diagram_sheet.write(notes_row + 4, 0, "4. Array columns (type[]) are used for storing multiple values like tags and networks.")
diagram_sheet.write(notes_row + 5, 0, "5. The 'details' column in collaborations uses JSONB for flexible, type-specific storage.")
diagram_sheet.write(notes_row + 6, 0, "6. Filter toggle states are stored as separate boolean columns for clarity and performance.")

# Save the Excel file
writer.close()

print("Comprehensive database schema Excel file has been created: collab_room_database_schema.xlsx")