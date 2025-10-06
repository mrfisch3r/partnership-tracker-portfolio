from models import db
from models import *
from sqlalchemy import func
import pandas as pd

def search_entries(model, column_name, search_string):
    """
    Search for entries in the given model (table) where the specified column contains the search string (case-insensitive).
    
    :param model: The SQLAlchemy model (table) to search in.
    :param column_name: The column to search within.
    :param search_string: The string to search for.
    :return: A list of matching entries.
    """
    if not search_string.strip():  # Prevent searching with empty strings
        return []
    
    column = getattr(model, column_name, None)
    if column is None:
        raise ValueError(f"Column '{column_name}' not found in model '{model.__name__}'")

    # Case-insensitive search
    results = model.query.filter(func.lower(column).like(f"%{search_string.lower()}%")).all()
    
    return results


def is_duplicate_entry(model, name, organization_name):
    """
    Check if a duplicate entry exists in the given model (table), ignoring case sensitivity.
    """
    if not name or not organization_name:  # Prevent searching with empty values
        return False

    existing_entry = model.query.filter(
        func.lower(model.name) == name.lower(),
        func.lower(model.organization_name) == organization_name.lower()
    ).first()
    
    return existing_entry is not None  # Returns True if a duplicate exists


def sort_entries_by_date(model, column_name, ascending=True):
    """
    Sort entries in the given model (table) by the specified date column.
    
    :param model: The SQLAlchemy model (table) to search in.
    :param column_name: The date column to sort by (assumed to be in MM/DD/YYYY format).
    :param ascending: Whether to sort in ascending (True) or descending (False) order.
    :return: A list of sorted entries.
    """
    column = getattr(model, column_name, None)
    if column is None:
        raise ValueError(f"Column '{column_name}' not found in model '{model.__name__}'")
    
    # Sort in ascending or descending order based on the flag
    if ascending:
        results = model.query.order_by(func.strftime('%Y-%m-%d', column)).all()
    else:
        results = model.query.order_by(func.strftime('%Y-%m-%d', column).desc()).all()
    
    return results


#outreach and seasonal events sheets have same format so this function is for them both
def events_sheet_reader(file_path, sheet_keywords, model):
    xls = pd.ExcelFile(file_path)
    sheet_name = None

    # Case-insensitive sheet name matching
    for name in xls.sheet_names:
        if sheet_keywords.lower() in name.lower():
            sheet_name = name
            break

    # If no valid sheet is found, exit function
    if not sheet_name:
        print(f"No relevant sheet found ({sheet_keywords}). Skipping import.")
        return

    # Read the identified sheet, skipping first 2 rows
    df = pd.read_excel(file_path, sheet_name=sheet_name, skiprows=2)

    # Column Mapping
    column_mapping = {
        "Name": "name",
        "Organization": "organization_name",
        "Contact Info": "contacts",  # Needs special handling
        "Target Population": "target_population",
        "Event Date(s)": "event_dates",
        "Reoccuring Event? (Y/N) If so, List Frequency": "reoccuring_event",
        "Notes - Any Risk for Population not Listed in RedCap Please Note Here:": "notes"
    }

    # Rename columns
    df = df.rename(columns=column_mapping)

    # Handle missing columns safely
    df = df.reindex(columns=column_mapping.values())

    # Convert DataFrame to ORM objects
    event_objects = [
        model(
            name=row["name"],
            organization_name=row["organization_name"],
            contacts=row["contacts"],
            target_population=row["target_population"],
            event_dates=row["event_dates"],
            reoccuring_event=row["reoccuring_event"],
            notes=row["notes"]
        ) for _, row in df.iterrows()
    ]

    # Bulk insert into the database
    db.session.bulk_save_objects(event_objects)
    db.session.commit()

    print(f"Data successfully imported from '{sheet_name}' into {model.__name__}!")

# Call for Outreach Events
def outreach_events_sheet_reader(file_path):
    events_sheet_reader(file_path, "outreach events", OutreachEvents)

# Call for Seasonal Events
def seasonal_events_sheet_reader(file_path):
    events_sheet_reader(file_path, "seasonal events", SeasonalEvents)


#Read the Potential Partnerships sheet into corresponding table
def potential_partnerships_sheet_reader(file_path):
    xls = pd.ExcelFile(file_path)
    sheet_name = None

    # Case-insensitive sheet name check
    for name in xls.sheet_names:
        if "potential partnerships" in name.lower():
            sheet_name = name
            break

    # If no valid sheet is found, exit function
    if not sheet_name:
        print("No relevant sheet found (Potential Partnerships). Skipping import.")
        return

    # Read the identified sheet, skipping first 2 rows
    df = pd.read_excel(file_path, sheet_name=sheet_name, skiprows=2)

    # Column Mapping
    column_mapping = {
        "Name": "name",
        "Organization": "organization_name",
        "Contact Info": "contacts",  # Needs special handling
        "Target Population": "target_population",
        "Contact Date": "contact_date",
        "Type of Attempted Contact/Date of Next Attempt:": "next_contact",
        "Notes:": "notes"
    }

    # Rename DataFrame columns
    df = df.rename(columns=column_mapping)

    # Handle missing columns safely
    df = df.reindex(columns=column_mapping.values())

    # Convert DataFrame to ORM objects
    partnership_objects = [
        PotentialPartnerships(
            name=row["name"],
            organization_name=row["organization_name"],
            contacts=row["contacts"],
            target_population=row["target_population"],
            contact_date=row["contact_date"],
            next_contact=row["next_contact"],
            notes=row["notes"]
        ) for _, row in df.iterrows()
    ]

    # Bulk insert into the database
    db.session.bulk_save_objects(partnership_objects)
    db.session.commit()

    print(f"Data successfully imported from '{sheet_name}' into PotentialPartnerships!")
    
    
#Read the Not Potential Partnerships sheet into corresponding table
def not_potential_partnerships_sheet_reader(file_path):
    xls = pd.ExcelFile(file_path)
    sheet_name = None

    # Case-insensitive sheet name check
    for name in xls.sheet_names:
        if "not potential partnerships" in name.lower():
            sheet_name = name
            break

    # If no valid sheet is found, exit function
    if not sheet_name:
        print("No relevant sheet found (Not Potential Partnerships). Skipping import.")
        return

    # Read the identified sheet, skipping first 2 rows
    df = pd.read_excel(file_path, sheet_name=sheet_name, skiprows=2)

    # Column Mapping
    column_mapping = {
        "Name": "name",
        "Organization": "organization_name",
        "Contact Info": "contacts",  # Needs special handling
        "Target Population": "target_population",
        "Contact Date": "contact_date",
        "Type of Attempted Contact:": "contact_attempt",
        "Notes:": "notes"
    }

    # Rename columns
    df = df.rename(columns=column_mapping)

    # Handle missing columns safely
    df = df.reindex(columns=column_mapping.values())

    # Convert DataFrame to ORM objects
    partnership_objects = [
        NotPotentialPartnerships(
            name=row["name"],
            organization_name=row["organization_name"],
            contacts=row["contacts"],
            target_population=row["target_population"],
            contact_date=row["contact_date"],
            contact_attempt=row["contact_attempt"],
            notes=row["notes"]
        ) for _, row in df.iterrows()
    ]

    # Bulk insert into the database
    db.session.bulk_save_objects(partnership_objects)
    db.session.commit()

    print(f"Data successfully imported from '{sheet_name}' into NotPotentialPartnerships!")
    
    
#Read the Monthly Updates/ Monthly Highlights sheet into corresponding table
def monthly_updates_sheet_reader(file_path):
    xls = pd.ExcelFile(file_path)
    sheet_name = None

    # Case-insensitive check for sheet names
    for name in xls.sheet_names:
        lower_name = name.lower()  # Convert to lowercase for comparison
        if "monthly updates" in lower_name:
            sheet_name = name
            break
        elif "monthly highlights" in lower_name:
            sheet_name = name
            break

    # If no valid sheet was found, print an error and exit function
    if not sheet_name:
        print("No relevant sheet found (Monthly Updates or Monthly Highlights). Skipping import.")
        return

    # Read the identified sheet, skipping first 2 rows
    df = pd.read_excel(file_path, sheet_name=sheet_name, skiprows=2)

    # Column Mapping
    column_mapping = {
        "Month": "month_year",
        "Any Major Findings in Reaching Target Population(s)?": "major_findings",
        "Barriers Encountered and How the Barriers Were or Can Be Addressed:": "barriers_and_solutions",
        "Other Additional Notes to Share from you for the month?": "notes",
    }

    # Rename DataFrame columns
    df = df.rename(columns=column_mapping)

    # Handle missing columns safely
    df = df.reindex(columns=column_mapping.values())

    # Convert DataFrame to ORM objects
    update_objects = [
        MonthlyUpdates(
            month_year=row["month_year"],
            major_findings=row["major_findings"],
            barriers_and_solutions=row["barriers_and_solutions"],
            notes=row["notes"]
        ) for _, row in df.iterrows()
    ]

    # Bulk insert into the database
    db.session.bulk_save_objects(update_objects)
    db.session.commit()

    print(f"Data successfully imported from '{sheet_name}' into MonthlyUpdates!")
    
 
#Create a table for a county   
def create_county_model(county_name):
    # Sanitize table name
    table_name = county_name.strip().replace(" ", "_").lower()

    # Check if table exists
    inspector = db.inspect(db.engine)
    if table_name in inspector.get_table_names():
        print(f"Table '{table_name}' already exists. Skipping creation.")
        return None

    # Dynamically create a subclass of DynamicCounty
    class CountyTable(DynamicCounty):
        __tablename__ = table_name

    # Create the table in DB
    CountyTable.__table__.create(bind=db.engine)
    print(f"Table '{table_name}' created successfully.")

    return CountyTable


#Create an instance of the model/table into a dict
def model_to_dict(instance):
    """
    Convert a SQLAlchemy model instance into a dict.
    Works for any model since it inspects columns dynamically.
    """
    return {
        column.name: getattr(instance, column.name)
        for column in instance.__table__.columns
    }
    

def log_change(instance, user_id, action, previous_instance=None):
    """
    Create a ChangeLog entry for any SQLAlchemy model.
    Accepts either a model instance or dict for previous_instance.
    """
    # If previous_instance is provided as dict, use it directly
    if isinstance(previous_instance, dict):
        previous_data = previous_instance
    elif previous_instance is not None:
        previous_data = model_to_dict(previous_instance)
    else:
        previous_data = None

    # Always convert the current instance to dict (unless DELETE)
    new_data = model_to_dict(instance) if action != "DELETE" else None

    log = ChangeLog(
        table_name=instance.__tablename__,
        record_id=instance.id,
        user_id=user_id,
        action=action,
        previous_data=previous_data,
        new_data=new_data
    )

    db.session.add(log)
    db.session.commit()

