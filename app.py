from flask import Flask, jsonify, request
from flask_cors import CORS
from models import *
from functions import *
import os
from functools import wraps
from flask_jwt_extended import JWTManager, create_access_token, get_jwt_identity, jwt_required


app.config["JWT_SECRET_KEY"] = "super-secret-key"  # replace with env var in production
jwt = JWTManager(app)

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///database.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

CORS(
    app,
    resources={r"/api/*": {
        "origins": ["http://localhost:5173"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True,
        "expose_headers": ["Content-Type"]
    }},
    supports_credentials=True  # keep also at top-level for clarity
)
db.init_app(app)


# Ensure tables are created
with app.app_context():
    db.create_all()
    
    
#_______________________________________________________________________________________________________________________________

#FUNCTIONS REGARDING THE STAFF TABLE

@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json()
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")
    role = data.get("role", "viewer")

    if Staff.query.filter((Staff.username == username) | (Staff.email == email)).first():
        return jsonify({"error": "Username or email already exists"}), 400

    new_staff = Staff(username=username, email=email, role=role)
    new_staff.set_password(password)

    db.session.add(new_staff)
    db.session.commit()

    return jsonify({"message": "Staff registered successfully"}), 201



@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    staff = Staff.query.filter_by(username=username).first()
    if not staff or not staff.check_password(password):
        return jsonify({"error": "Invalid username or password"}), 401

    # Create JWT with role info inside
    access_token = create_access_token(identity={"id": staff.id, "role": staff.role})
    return jsonify({"access_token": access_token}), 200



def role_required(required_role):
    def wrapper(fn):
        @wraps(fn)
        @jwt_required()
        def decorated(*args, **kwargs):
            identity = get_jwt_identity()
            if identity["role"] != required_role:
                return jsonify({"error": "Insufficient permissions"}), 403
            return fn(*args, **kwargs)
        return decorated
    return wrapper


#_____________________________________________________________________________________________________________
#SEARCH CALL, CAN BE USED ON ANY COLUMN BUT WILL PROBABLY BE BEST ON NAME AND ORGANIZATION NAME
@app.route("/api/search", methods=["GET"])
def search():
    model_map = {
        "outreach_events": OutreachEvents,
        "seasonal_events": SeasonalEvents,
        "potential_partners": PotentialPartnerships,
        "not_partners": NotPotentialPartnerships,
        "monthly_updates": MonthlyUpdates
    }

    model_name = request.args.get("model")
    column_name = request.args.get("column")
    query = request.args.get("query", "").strip()

    if not model_name or not column_name or not query:
        return jsonify({"error": "Missing required query parameters: model, column, query"}), 400

    model = model_map.get(model_name.lower())
    if not model:
        return jsonify({"error": f"Model '{model_name}' not found."}), 404

    try:
        results = search_entries(model, column_name, query)
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400

    # Dynamically serialize results
    output = []
    for item in results:
        serialized = {column.name: getattr(item, column.name) for column in item.__table__.columns}
        output.append(serialized)

    return jsonify(output), 200

#_____________________________________________________________________________________________________________

#GET OutreachEvents TABLE
@app.route("/api/get_outreach_events")
def get_outreach_events():
    events = OutreachEvents.query.all()
    result = [
        {
            "id": e.id,
            "name": e.name,
            "organization_name": e.organization_name,
            "contacts": e.contacts,
            "target_population": e.target_population,
            "event_dates": e.event_dates,
            "reoccuring_event": e.reoccuring_event,
            "notes": e.notes
        } for e in events
    ]
    return jsonify(result)


#GET SeasonalEvents TABLE
@app.route("/api/get_seasonal_events")
def get_seasonal_events():
    events = SeasonalEvents.query.all()
    result = [
        {
            "id": e.id,
            "name": e.name,
            "organization_name": e.organization_name,
            "contacts": e.contacts,
            "target_population": e.target_population,
            "event_dates": e.event_dates,
            "reoccuring_event": e.reoccuring_event,
            "notes": e.notes
        }
        for e in events
    ]
    return jsonify(result)


#GET PotentialPartnerships TABLE
@app.route("/api/get_partners")
def get_partners():
    partners = PotentialPartnerships.query.all()
    result = [
        {
            "id": p.id,
            "name": p.name,
            "organization_name": p.organization_name,
            "contacts": p.contacts,
            "target_population": p.target_population,
            "contact_date": p.contact_date,
            "next_contact": p.next_contact,
            "notes": p.notes
        }
        for p in partners
    ]
    return jsonify(result)


#GET NotPotentialPartnerships TABLE
@app.route("/api/get_not_partners")
def get_not_partners():
    notpartners = NotPotentialPartnerships.query.all()
    result = [
        {
            "id": n.id,
            "name": n.name,
            "organization_name": n.organization_name,
            "contacts": n.contacts,
            "target_population": n.target_population,
            "contact_date": n.contact_date,
            "contact_attempt": n.contact_attempt,
            "notes": n.notes
        }
        for n in notpartners
    ]
    return jsonify(result)


#GET MonthlyUpdates TABLE
@app.route("/api/get_monthly_updates")
def get_monthly_updates():
    updates = MonthlyUpdates.query.all()
    result = [
        {
            "id": u.id,
            "month_year": u.month_year,
            "major_findings": u.major_findings,
            "barriers_and_solutions": u.barriers_and_solutions,
            "notes": u.notes
        }
        for u in updates
    ]
    return jsonify(result)


# GET ALL ENTRIES IN A COUNTY TABLE
@app.route("/api/get_county_entries", methods=["GET"])
def get_county_entries():
    county_name = request.args.get("county_name")

    if not county_name:
        return jsonify({"error": "Missing 'county_name' query parameter"}), 400

    # Sanitize table name
    table_name = county_name.strip().replace(" ", "_").lower()

    # Check if table exists
    inspector = db.inspect(db.engine)
    if table_name not in inspector.get_table_names():
        return jsonify({"error": f"County table '{county_name}' does not exist."}), 404

    # Dynamically create model class for this county table
    class CountyTable(DynamicCounty):
        __tablename__ = table_name

    # Query all entries
    entries = CountyTable.query.all()
    result = [
        {column.name: getattr(entry, column.name) for column in entry.__table__.columns}
        for entry in entries
    ]

    return jsonify(result)

#____________________________________________________________________________________________________________

#ADD A DUMMY DATA FOR POTENTIAL PARTNERSHIPS
@app.route("/api/add-simple-partner", methods=["POST"])
def add_simple_partner():
    existing = PotentialPartnerships.query.filter_by(name="Community Partner A").first()
    if existing:
        return {"message": "Already exists."}

    partner = PotentialPartnerships(
        name="Community Partner A",
        
    )
    db.session.add(partner)
    db.session.commit()
    return {"message": "Simple partner added."}



#DELETE DATABASE API CALL, USE FOR TESTING AFTER ADDING DUMMY DATA
@app.route("/api/clear-all", methods=["DELETE", "GET"])
def clear_all():
    db.session.query(OutreachEvents).delete()
    db.session.query(SeasonalEvents).delete()
    db.session.query(PotentialPartnerships).delete()
    db.session.query(NotPotentialPartnerships).delete()
    db.session.query(MonthlyUpdates).delete()

    db.session.commit()
    return {"MESSAGE": "ENTIRE DATABASE CLEARED."}

#___________________________________________________________________________________________________________

#UPLOAD Outreach Events SHEET
@app.route("/api/upload_outreach_events", methods=["POST"])
def upload_outreach_events():
    if "file" not in request.files:
        return jsonify({"message": "No file part"}), 400
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"message": "No file selected"}), 400
    # Save the file temporarily
    temp_dir = "temp_files"
    os.makedirs(temp_dir, exist_ok=True)
    temp_path = os.path.join(temp_dir, file.filename)
    file.save(temp_path)
    try:
        outreach_events_sheet_reader(temp_path)
    except Exception as e:
        return jsonify({"message": "Error processing file", "error": str(e)}), 500
    finally:
        os.remove(temp_path)
    return jsonify({"message": "File uploaded and data imported successfully."})


#UPLOAD Seasonal Events SHEET
@app.route("/api/upload_seasonal_events", methods=["POST"])
def upload_seasonal_events():
    if "file" not in request.files:
        return jsonify({"message": "No file part"}), 400
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"message": "No file selected"}), 400
    # Save the file temporarily
    temp_dir = "temp_files"
    os.makedirs(temp_dir, exist_ok=True)
    temp_path = os.path.join(temp_dir, file.filename)
    file.save(temp_path)
    try:
        seasonal_events_sheet_reader(temp_path)
    except Exception as e:
        return jsonify({"message": "Error processing file", "error": str(e)}), 500
    finally:
        os.remove(temp_path)
    return jsonify({"message": "File uploaded and data imported successfully."})


#UPLOAD Potential Partners SHEET
@app.route("/api/upload_partners", methods=["POST"])
def upload_partners():
    if "file" not in request.files:
        return jsonify({"message": "No file part"}), 400
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"message": "No file selected"}), 400
    # Save the file temporarily
    temp_dir = "temp_files"
    os.makedirs(temp_dir, exist_ok=True)
    temp_path = os.path.join(temp_dir, file.filename)
    file.save(temp_path)
    try:
        potential_partnerships_sheet_reader(temp_path)
    except Exception as e:
        return jsonify({"message": "Error processing file", "error": str(e)}), 500
    finally:
        os.remove(temp_path)
    return jsonify({"message": "File uploaded and data imported successfully."})


#UPLOAD Not Potential Partners SHEET
@app.route("/api/upload_not_partners", methods=["POST"])
def upload_not_partners():
    if "file" not in request.files:
        return jsonify({"message": "No file part"}), 400
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"message": "No file selected"}), 400
    # Save the file temporarily
    temp_dir = "temp_files"
    os.makedirs(temp_dir, exist_ok=True)
    temp_path = os.path.join(temp_dir, file.filename)
    file.save(temp_path)
    try:
        not_potential_partnerships_sheet_reader(temp_path)
    except Exception as e:
        return jsonify({"message": "Error processing file", "error": str(e)}), 500
    finally:
        os.remove(temp_path)
    return jsonify({"message": "File uploaded and data imported successfully."})


#UPLOAD Monthly Updates SHEET
@app.route("/api/upload_monthly_updates", methods=["POST"])
def upload_monthly_updates():
    if "file" not in request.files:
        return jsonify({"message": "No file part"}), 400
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"message": "No file selected"}), 400
    # Save the file temporarily
    temp_dir = "temp_files"
    os.makedirs(temp_dir, exist_ok=True)
    temp_path = os.path.join(temp_dir, file.filename)
    file.save(temp_path)
    try:
        monthly_updates_sheet_reader(temp_path)
    except Exception as e:
        return jsonify({"message": "Error processing file", "error": str(e)}), 500
    finally:
        os.remove(temp_path)
    return jsonify({"message": "File uploaded and data imported successfully."})

#________________________________________________________________________________________________________________________

# ADD AN ENTRY TO OutreachEvents TABLE
@app.route("/api/add_outreach_event", methods=["POST"])
def add_outreach_event():
    data = request.json
    name = data.get("name")
    org_name = data.get("organization_name")

    if is_duplicate_entry(OutreachEvents, name, org_name):
        return jsonify({
            "message": "This name and organization are already in the database."
        }), 409

    new_event = OutreachEvents(
        name=data.get("name"),
        organization_name=data.get("organization_name"),
        contacts=data.get("contacts"),
        target_population=data.get("target_population"),
        event_dates=data.get("event_dates"),
        reoccuring_event=data.get("reoccuring_event"),
        notes=data.get("notes")
    )

    # Save the new event first (so it gets an ID)
    db.session.add(new_event)
    db.session.commit()
    
    identity = get_jwt_identity()
    user_id = identity["id"]


    # Now log the creation
    log_change(new_event, user_id=user_id, action="CREATE")

    return jsonify({
        "message": "Outreach event added successfully.",
        "event": {
            "id": new_event.id,
            "name": new_event.name,
            "organization_name": new_event.organization_name,
            "contacts": new_event.contacts,
            "target_population": new_event.target_population,
            "event_dates": new_event.event_dates,
            "reoccuring_event": new_event.reoccuring_event,
            "notes": new_event.notes
        }
    })

    
#ADD AN ENTRY TO SeasonalEvents TABLE
@app.route("/api/add_seasonal_event", methods=["POST"])
def add_seasonal_event():
    data = request.json
    name = data.get("name")
    org_name = data.get("organization_name")

    if is_duplicate_entry(SeasonalEvents, name, org_name):
        return jsonify({
            "message": "This name and organization are already in the database."
        }), 409
        
    new_event = SeasonalEvents(
        name=data.get("name"),
        organization_name=data.get("organization_name"),
        contacts=data.get("contacts"),
        target_population=data.get("target_population"),
        event_dates=data.get("event_dates"),
        reoccuring_event=data.get("reoccuring_event"),  # fixed spelling to match model
        notes=data.get("notes")
    )
    db.session.add(new_event)
    db.session.commit()
    
    identity = get_jwt_identity()
    user_id = identity["id"]
    
    # Now log the creation
    log_change(new_event, user_id=user_id, action="CREATE")
    
    return jsonify({
        "message": "Seasonal event added successfully.",
        "event": {
            "id": new_event.id,
            "name": new_event.name,
            "organization_name": new_event.organization_name,
            "contacts": new_event.contacts,
            "target_population": new_event.target_population,
            "event_dates": new_event.event_dates,
            "reoccuring_event": new_event.reoccuring_event,  # consistent spelling
            "notes": new_event.notes
        }
    })


#ADD AN ENTRY TO PotentialPartnerships TABLE
@app.route("/api/add_potential_partner", methods=["POST"])
def add_partner():
    data = request.json
    name = data.get("name")
    org_name = data.get("organization_name")

    if is_duplicate_entry(PotentialPartnerships, name, org_name):
        return jsonify({
            "message": "This name and organization are already in the database."
        }), 409
        
    new_partner = PotentialPartnerships(
        name=data.get("name"),
        organization_name=data.get("organization_name"),
        contacts = data.get("contacts"),
        target_population = data.get("target_population"),
        contact_date = data.get("contact_date"),
        next_contact = data.get("next_contact"),
        notes = data.get("notes")
    )
    db.session.add(new_partner)
    db.session.commit()
    
    identity = get_jwt_identity()
    user_id = identity["id"]
    
    # Now log the creation
    log_change(new_partner, user_id=user_id, action="CREATE")
    
    return jsonify({
        "message": "Partner added successfully.",
        "partner": {
            "id": new_partner.id,
            "name": new_partner.name,
            "organization name": new_partner.organization_name,
            "contacts": new_partner.contacts,
            "target population": new_partner.target_population,
            "contact date": new_partner.contact_date,
            "next contact": new_partner.next_contact,
            "notes": new_partner.notes
        }
    })
    
    
#ADD ENTRY TO NotPotentialPartnerships TABLE
@app.route("/api/add_not_potential_partner", methods=["POST"])
def add_not_potential_partner():
    data = request.json
    name = data.get("name")
    org_name = data.get("organization_name")

    if is_duplicate_entry(NotPotentialPartnerships, name, org_name):
        return jsonify({
            "message": "This name and organization are already in the database."
        }), 409
        
    new_entry = NotPotentialPartnerships(
        name=data.get("name"),
        organization_name=data.get("organization_name"),
        contacts=data.get("contacts"),
        target_population=data.get("target_population"),
        contact_date=data.get("contact_date"),
        contact_attempt=data.get("contact_attempt"),
        notes=data.get("notes")
    )
    
    db.session.add(new_entry)
    db.session.commit()
    
    identity = get_jwt_identity()
    user_id = identity["id"]
    
    # Now log the creation
    log_change(new_entry, user_id=user_id, action="CREATE")
    
    return jsonify({
        "message": "Not potential partner added successfully.",
        "not_potential_partner": {  # updated to reflect the name more clearly
            "id": new_entry.id,
            "name": new_entry.name,
            "organization_name": new_entry.organization_name,
            "contacts": new_entry.contacts,
            "target_population": new_entry.target_population,
            "contact_date": new_entry.contact_date,
            "contact_attempt": new_entry.contact_attempt,
            "notes": new_entry.notes
        }
    })

    
#ADD ENTRY TO MonthlyUpates TABLE
@app.route("/api/add_monthly_update", methods=["POST"])
def add_monthly_update():
    data = request.json
    new_update = MonthlyUpdates(
        month_year=data.get("month_year"),
        major_findings=data.get("major_findings"),
        barriers_and_solutions=data.get("barriers_and_solutions"),
        notes=data.get("notes")
    )
    db.session.add(new_update)
    db.session.commit()
    
    identity = get_jwt_identity()
    user_id = identity["id"]
    
    # Now log the creation
    log_change(new_update, user_id=user_id, action="CREATE")
    
    return jsonify({
        "message": "Monthly update added successfully.",
        "update": {
            "id": new_update.id,
            "month_year": new_update.month_year,
            "major_findings": new_update.major_findings,
            "barriers_and_solutions": new_update.barriers_and_solutions,
            "notes": new_update.notes
        }
    })
    

# ADD ENTRY TO A COUNTY TABLE
@app.route("/api/add_county_entry", methods=["POST"])
def add_county_entry():
    data = request.json
    county_name = data.get("county_name")

    if not county_name:
        return jsonify({"error": "Missing 'county_name' field"}), 400

    # Sanitize table name
    table_name = county_name.strip().replace(" ", "_").lower()

    # Check if table exists
    inspector = db.inspect(db.engine)
    if table_name in inspector.get_table_names():
        # Table exists, dynamically create a model class for it
        class CountyTable(DynamicCounty):
            __tablename__ = table_name
    else:
        # Table does not exist, create it using your function
        CountyTable = create_county_model(county_name)
        if CountyTable is None:
            return jsonify({"error": "Failed to create county table."}), 500

    # Create new entry from JSON data
    new_entry = CountyTable(
        need=data.get("need"),
        agency=data.get("agency"),
        county=data.get("county"),
        town=data.get("town"),
        contact_name=data.get("contact_name"),
        contact_info=data.get("contact_info"),
        address=data.get("address"),
        hours=data.get("hours"),
        referral_process=data.get("referral_process"),
        restrictions=data.get("restrictions"),
        insurance=data.get("insurance"),
        other=data.get("other")
    )

    db.session.add(new_entry)
    db.session.commit()
    
    identity = get_jwt_identity()
    user_id = identity["id"]
    
    # Now log the creation
    log_change(new_entry, user_id=user_id, action="CREATE")

    return jsonify({
        "message": f"Entry added to '{county_name}' table successfully.",
        "entry": {column.name: getattr(new_entry, column.name) for column in new_entry.__table__.columns}
    })
    
#_____________________________________________________________________________________________________________________        
    
#UPDATE ENTRY IN OutreachEvents TABLE    
@app.route("/api/update_outreach_event/<int:id>", methods=["PUT"])
def update_outreach_event(id):
    data = request.json
    event = OutreachEvents.query.get(id)
    if not event:
        return jsonify({"message": "Event not found"}), 404
    
    previous_snapshot = model_to_dict(event)
    
    event.name = data.get("name", event.name)
    event.organization_name = data.get("organization_name", event.organization_name)
    event.contacts = data.get("contacts", event.contacts)
    event.target_population = data.get("target_population", event.target_population)
    event.event_dates = data.get("event_dates", event.event_dates)
    event.reoccuring_event = data.get("reoccuring_event", event.reoccuring_event)
    event.notes = data.get("notes", event.notes)

    db.session.commit()
    
    identity = get_jwt_identity()
    user_id = identity["id"]
    
    log_change(
        instance=event,
        user_id=user_id,  # Replace with current logged-in user ID
        action="UPDATE",
        previous_instance=previous_snapshot  # use snapshot for previous_data
    )

    return jsonify({
        "message": "Event updated successfully.",
        "event": {
            "id": event.id,
            "name": event.name,
            "organization_name": event.organization_name,
            "contacts": event.contacts,
            "target_population": event.target_population,
            "event_dates": event.event_dates,
            "reoccuring_event": event.reoccuring_event,
            "notes": event.notes
        }
    })
    
    
#UPDATE ENTRY IN SeasonalEvents TABLE  
@app.route("/api/update_seasonal_event/<int:id>", methods=["PUT"])
def update_seasonal_event(id):
    data = request.json
    event = SeasonalEvents.query.get(id)
    if not event:
        return jsonify({"message": "Event not found"}), 404
    
    previous_snapshot = model_to_dict(event)
    
    event.name = data.get("name", event.name)
    event.organization_name = data.get("organization_name", event.organization_name)
    event.contacts = data.get("contacts", event.contacts)
    event.target_population = data.get("target_population", event.target_population)
    event.event_dates = data.get("event_dates", event.event_dates)
    event.reoccuring_event = data.get("reoccuring_event", event.reoccuring_event)
    event.notes = data.get("notes", event.notes)

    db.session.commit()
    
    identity = get_jwt_identity()
    user_id = identity["id"]
    
    log_change(
        instance=event,
        user_id=user_id,  # Replace with current logged-in user ID
        action="UPDATE",
        previous_instance=previous_snapshot  # use snapshot for previous_data
    )

    return jsonify({
        "message": "Event updated successfully.",
        "event": {
            "id": event.id,
            "name": event.name,
            "organization_name": event.organization_name,
            "contacts": event.contacts,
            "target_population": event.target_population,
            "event_dates": event.event_dates,
            "reoccuring_event": event.reoccuring_event,
            "notes": event.notes
        }
    })
    

#UPDATE ENTRY IN PotentialPartnerships TABLE  
@app.route("/api/update_potential_partners/<int:id>", methods=["PUT"])
def update_partners(id):
    data = request.json
    partner = PotentialPartnerships.query.get(id)
    if not partner:
        return jsonify({"message": "Event not found"}), 404
    
    previous_snapshot = model_to_dict(partner)
    
    partner.name = data.get("name", partner.name)
    partner.organization_name = data.get("organization_name", partner.organization_name)
    partner.contacts = data.get("contacts", partner.contacts)
    partner.target_population = data.get("target_population", partner.target_population)
    partner.contact_date = data.get("partner_dates", partner.contact_date)
    partner.next_contact = data.get("reoccuring_partner", partner.next_contact)
    partner.notes = data.get("notes", partner.notes)

    db.session.commit()
    
    identity = get_jwt_identity()
    user_id = identity["id"]
    
    log_change(
        instance=partner,
        user_id=user_id,  # Replace with current logged-in user ID
        action="UPDATE",
        previous_instance=previous_snapshot  # use snapshot for previous_data
    )

    return jsonify({
        "message": "Partner updated successfully.",
        "event": {
            "id": partner.id,
            "name": partner.name,
            "organization name": partner.organization_name,
            "contacts": partner.contacts,
            "target population": partner.target_population,
            "contact date": partner.contact_date,
            "next contact": partner.next_contact,
            "notes": partner.notes
        }
    })
    
    
#UPDATE ENTRY IN NotPotentialPartnerships TABLE  
@app.route("/api/update_not_potential_partners/<int:id>", methods=["PUT"])
def update_not_partners(id):
    data = request.json
    partner = NotPotentialPartnerships.query.get(id)
    if not partner:
        return jsonify({"message": "Event not found"}), 404
    
    previous_snapshot = model_to_dict(partner)
    
    partner.name = data.get("name", partner.name)
    partner.organization_name = data.get("organization_name", partner.organization_name)
    partner.contacts = data.get("contacts", partner.contacts)
    partner.target_population = data.get("target_population", partner.target_population)
    partner.contact_date = data.get("partner_dates", partner.contact_date)
    partner.contact_attempt = data.get("reoccuring_partner", partner.contact_attempt)
    partner.notes = data.get("notes", partner.notes)

    db.session.commit()
    
    identity = get_jwt_identity()
    user_id = identity["id"]
    
    log_change(
        instance=partner,
        user_id=user_id,  # Replace with current logged-in user ID
        action="UPDATE",
        previous_instance=previous_snapshot  # use snapshot for previous_data
    )

    return jsonify({
        "message": "Not Partner updated successfully.",
        "event": {
            "id": partner.id,
            "name": partner.name,
            "organization_name": partner.organization_name,
            "contacts": partner.contacts,
            "target_population": partner.target_population,
            "contact_date": partner.contact_date,
            "contact_attempt": partner.contact_attempt,
            "notes": partner.notes
        }
    })


# UPDATE ENTRY IN A COUNTY TABLE
@app.route("/api/update_county_entry/<int:id>", methods=["PUT"])
def update_county_entry(id):
    data = request.json
    county_name = data.get("county_name")

    if not county_name:
        return jsonify({"error": "Missing 'county_name' field"}), 400

    # Sanitize table name
    table_name = county_name.strip().replace(" ", "_").lower()

    # Check if table exists
    inspector = db.inspect(db.engine)
    if table_name not in inspector.get_table_names():
        return jsonify({"error": f"County table '{county_name}' does not exist."}), 404

    # Dynamically create model class for this county table
    class CountyTable(DynamicCounty):
        __tablename__ = table_name

    # Get the entry to update
    entry = db.session.get(CountyTable, id)
    if not entry:
        return jsonify({"error": f"Entry with ID {id} not found in '{county_name}'."}), 404
    
    previous_snapshot = model_to_dict(entry)

    # Explicitly assign fields (like other endpoints)
    entry.need = data.get("need", entry.need)
    entry.agency = data.get("agency", entry.agency)
    entry.county = data.get("county", entry.county)
    entry.town = data.get("town", entry.town)
    entry.contact_name = data.get("contact_name", entry.contact_name)
    entry.contact_info = data.get("contact_info", entry.contact_info)
    entry.address = data.get("address", entry.address)
    entry.hours = data.get("hours", entry.hours)
    entry.referral_process = data.get("referral_process", entry.referral_process)
    entry.restrictions = data.get("restrictions", entry.restrictions)
    entry.insurance = data.get("insurance", entry.insurance)
    entry.other = data.get("other", entry.other)

    db.session.commit()
    
    identity = get_jwt_identity()
    user_id = identity["id"]
    
    log_change(
        instance=entry,
        user_id=user_id,  # Replace with current logged-in user ID
        action="UPDATE",
        previous_instance=previous_snapshot # use snapshot for previous_data
    )

    return jsonify({
        "message": f"Entry with ID {id} in '{county_name}' updated successfully.",
        "entry": {column.name: getattr(entry, column.name) for column in entry.__table__.columns}
    })
    
#___________________________________________________________________________________________________________________

#GENERALIZED DELETE ENTRY FUNCTION
@app.route('/api/delete_entry', methods=['DELETE'])
def delete_entry():
    data = request.get_json()
    table_name = data.get('table')
    entry_id = data.get('id')

    # Map table name to model
    model_map = {
        'outreachevents': OutreachEvents,
        'seasonalevents': SeasonalEvents,
        'potentialpartnerships': PotentialPartnerships,
        'notpotentialpartnerships': NotPotentialPartnerships,
        'monthlyupdates': MonthlyUpdates,
    }

    model = model_map.get(table_name.lower())
    if not model:
        return jsonify({'error': 'Invalid table name'}), 400

    entry = db.session.get(model, entry_id)
    if not entry:
        return jsonify({'error': 'Entry not found'}), 404
    
    previous_snapshot = model_to_dict(entry)
    
    identity = get_jwt_identity()
    user_id = identity["id"]

    # Log BEFORE deleting (so we still have the instance)
    log_change(
        instance=entry,          # pass the actual entry
        user_id=user_id,               # replace with current logged-in user ID
        action="DELETE",
        previous_instance=previous_snapshot
    )

    db.session.delete(entry)
    db.session.commit()
    

    return jsonify({'message': 'Entry deleted'}), 200


# DELETE ENTRY IN A COUNTY TABLE
@app.route("/api/delete_county_entry/<int:id>", methods=["DELETE"])
def delete_county_entry(id):
    data = request.json
    county_name = data.get("county_name")

    if not county_name:
        return jsonify({"error": "Missing 'county_name' field"}), 400

    # Sanitize table name
    table_name = county_name.strip().replace(" ", "_").lower()

    # Check if table exists
    inspector = db.inspect(db.engine)
    if table_name not in inspector.get_table_names():
        return jsonify({"error": f"County table '{county_name}' does not exist."}), 404

    # Dynamically create model class for this county table
    class CountyTable(DynamicCounty):
        __tablename__ = table_name

    # Get the entry to delete
    entry = db.session.get(CountyTable, id)
    if not entry:
        return jsonify({"error": f"Entry with ID {id} not found in '{county_name}'."}), 404
    
    previous_snapshot = model_to_dict(entry)
    
    identity = get_jwt_identity()
    user_id = identity["id"]

    # Log BEFORE deleting (so we still have the instance)
    log_change(
        instance=entry,          # pass the actual entry
        user_id=user_id,               # replace with current logged-in user ID
        action="DELETE",
        previous_instance=previous_snapshot
    )

    db.session.delete(entry)
    db.session.commit()

    return jsonify({
        "message": f"Entry with ID {id} deleted from '{county_name}' successfully."
    })


if __name__ == "__main__":
    app.run(debug=True, port=5001)
