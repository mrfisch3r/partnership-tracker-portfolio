from flask import Flask, jsonify, request
from flask_cors import CORS
from models import *
from functions import *
import os
import re
from functools import wraps
from flask_jwt_extended import JWTManager, create_access_token, get_jwt_identity, jwt_required




app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///database.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["JWT_SECRET_KEY"] = "super-secret-key"
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = False
app.config["JWT_COOKIE_CSRF_PROTECT"] = False
app.config["JWT_CSRF_IN_COOKIES"] = False
app.config["JWT_CSRF_CHECK_FORM"] = False
app.config["JWT_TOKEN_LOCATION"] = ["headers"]
app.config["JWT_HEADER_NAME"] = "Authorization"
app.config["JWT_HEADER_TYPE"] = "Bearer"
jwt = JWTManager(app)

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
    admin = Staff.query.filter_by(username="admin").first()
    if not admin:
        admin = Staff(username="admin", email="admin@ukhc.com", role="owner")
        admin.set_password("admin123")
        db.session.add(admin)
        db.session.commit()
        print("Default owner account created!")
    elif admin.role == "admin":
        # Upgrade existing admin to owner
        admin.role = "owner"
        db.session.commit()
        print("Upgraded admin to owner role!")
    
    
#_______________________________________________________________________________________________________________________________

#FUNCTIONS REGARDING THE STAFF TABLE

@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json()
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")
    role = data.get("role", "user")

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

    # Create JWT with staff.id as string identity, role and username in additional claims
    access_token = create_access_token(
        identity=str(staff.id),  # must be string
        additional_claims={"role": staff.role, "username": staff.username}
    )

    return jsonify({"access_token": access_token}), 200

# Answer CORS preflight for verify-token without requiring a JWT
@app.route("/api/verify-token", methods=["OPTIONS"])
def verify_token_options():
    return ('', 200)


@app.route("/api/verify-token", methods=["GET"])
@jwt_required()
def verify_token():
    """
    Simple endpoint used by the frontend to validate an access token.
    Returns 200 + {"valid": True} when the Authorization Bearer token is valid.
    """
    return jsonify({"valid": True}), 200


# GET CURRENT USER INFO
@app.route("/api/current_user", methods=["GET"])
@jwt_required()
def get_current_user():
    try:
        user_id = int(get_jwt_identity())
        user = Staff.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        return jsonify({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role
        }), 200
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid user"}), 401


# GET ALL USERS (Admin only)
@app.route("/api/users", methods=["GET"])
@jwt_required()
def get_all_users():
    try:
        user_id = int(get_jwt_identity())
        current_user = Staff.query.get(user_id)
        
        if not current_user or current_user.role not in ["admin", "owner"]:
            return jsonify({"error": "Admin access required"}), 403
        
        users = Staff.query.all()
        return jsonify([
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.role
            } for user in users
        ]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# UPDATE USER ROLE (Admin only)
@app.route("/api/users/<int:user_id>/role", methods=["PUT"])
@jwt_required()
def update_user_role(user_id):
    try:
        current_user_id = int(get_jwt_identity())
        current_user = Staff.query.get(current_user_id)
        
        if not current_user or current_user.role not in ["admin", "owner"]:
            return jsonify({"error": "Admin access required"}), 403
        
        target_user = Staff.query.get(user_id)
        if not target_user:
            return jsonify({"error": "User not found"}), 404
        
        # Prevent users from changing their own role
        if current_user_id == user_id:
            return jsonify({"error": "You cannot change your own role"}), 403
        
        data = request.get_json()
        new_role = data.get("role")
        
        if new_role not in ["admin", "user"]:
            return jsonify({"error": "Invalid role. Must be admin or user"}), 400
        
        # Prevent changing owner role
        if target_user.role == "owner":
            return jsonify({"error": "Cannot change owner role"}), 403
        
        target_user.role = new_role
        db.session.commit()
        
        return jsonify({
            "message": f"User role updated to {new_role}",
            "user": {
                "id": target_user.id,
                "username": target_user.username,
                "email": target_user.email,
                "role": target_user.role
            }
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# DELETE A USER (Admin/Owner only)
@app.route("/api/users/<int:user_id>", methods=["DELETE"])
@jwt_required()
def delete_user(user_id):
    try:
        # Get current user info
        current_user_id = int(get_jwt_identity())
        current_user = Staff.query.get(current_user_id)
        
        if not current_user:
            return jsonify({"error": "User not found"}), 404
        
        # Check if current user is admin or owner
        if current_user.role not in ["admin", "owner"]:
            return jsonify({"error": "Unauthorized. Admin or Owner role required"}), 403
        
        # Get target user
        target_user = Staff.query.get(user_id)
        if not target_user:
            return jsonify({"error": "User not found"}), 404
        
        # Prevent users from deleting themselves
        if current_user_id == user_id:
            return jsonify({"error": "You cannot delete yourself"}), 403
        
        # Prevent deleting owner accounts
        if target_user.role == "owner":
            return jsonify({"error": "Cannot delete owner accounts"}), 403
        
        # Delete the user
        db.session.delete(target_user)
        db.session.commit()
        
        return jsonify({"message": f"User {target_user.username} deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


#_____________________________________________________________________________________________________________
# TARGET POPULATION MANAGEMENT (Admin/Owner only)

# GET ALL TARGET POPULATIONS
@app.route("/api/target_populations", methods=["GET"])
def get_target_populations():
    try:
        from models import TargetPopulation
        populations = TargetPopulation.query.order_by(TargetPopulation.name).all()
        return jsonify({
            "target_populations": [
                {
                    "id": pop.id,
                    "name": pop.name,
                    "created_at": pop.created_at.isoformat()
                }
                for pop in populations
            ]
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ADD NEW TARGET POPULATION (Admin/Owner only)
@app.route("/api/target_populations", methods=["POST"])
@jwt_required()
def add_target_population():
    try:
        from models import TargetPopulation
        
        # Get current user info
        current_user_id = int(get_jwt_identity())
        current_user = Staff.query.get(current_user_id)
        
        if not current_user:
            return jsonify({"error": "User not found"}), 404
        
        # Check if current user is admin or owner
        if current_user.role not in ["admin", "owner"]:
            return jsonify({"error": "Unauthorized. Admin or Owner role required"}), 403
        
        data = request.get_json()
        name = data.get("name", "").strip()
        
        if not name:
            return jsonify({"error": "Target population name is required"}), 400
        
        # Check if already exists
        existing = TargetPopulation.query.filter_by(name=name).first()
        if existing:
            return jsonify({"error": "Target population already exists"}), 400
        
        new_population = TargetPopulation(name=name)
        db.session.add(new_population)
        db.session.commit()
        
        return jsonify({
            "message": "Target population added successfully",
            "target_population": {
                "id": new_population.id,
                "name": new_population.name,
                "created_at": new_population.created_at.isoformat()
            }
        }), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# DELETE TARGET POPULATION (Admin/Owner only)
@app.route("/api/target_populations/<int:population_id>", methods=["DELETE"])
@jwt_required()
def delete_target_population(population_id):
    try:
        from models import TargetPopulation
        
        # Get current user info
        current_user_id = int(get_jwt_identity())
        current_user = Staff.query.get(current_user_id)
        
        if not current_user:
            return jsonify({"error": "User not found"}), 404
        
        # Check if current user is admin or owner
        if current_user.role not in ["admin", "owner"]:
            return jsonify({"error": "Unauthorized. Admin or Owner role required"}), 403
        
        population = TargetPopulation.query.get(population_id)
        if not population:
            return jsonify({"error": "Target population not found"}), 404
        
        db.session.delete(population)
        db.session.commit()
        
        return jsonify({"message": f"Target population '{population.name}' deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# GET CHANGE LOGS (Admin/Owner only)
@app.route("/api/changelogs", methods=["GET"])
@jwt_required()
def get_changelogs():
    try:
        # Get current user info
        current_user_id = int(get_jwt_identity())
        current_user = Staff.query.get(current_user_id)
        
        if not current_user:
            return jsonify({"error": "User not found"}), 404
        
        # Check if current user is admin or owner
        if current_user.role not in ["admin", "owner"]:
            return jsonify({"error": "Unauthorized. Admin or Owner role required"}), 403
            
        # Fetch logs, newest first
        # We'll join with Staff table to get the username of the person who made the change
        logs = db.session.query(ChangeLog, Staff.username)\
            .outerjoin(Staff, ChangeLog.user_id == Staff.id)\
            .order_by(ChangeLog.timestamp.desc())\
            .limit(500)\
            .all()
            
        result = []
        for log, username in logs:
            result.append({
                "id": log.id,
                "table_name": log.table_name,
                "record_id": log.record_id,
                "user_id": log.user_id,
                "username": username or f"User ID {log.user_id}", # Fallback if user deleted
                "action": log.action,
                "timestamp": log.timestamp.isoformat(),
                "previous_data": log.previous_data, 
                "new_data": log.new_data
            })
            
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def role_required(required_role):
    """Decorator to require a specific role stored in JWT additional claims.

    Reads the role from JWT claims.
    Returns 403 if the role does not match.
    """
    def wrapper(fn):
        @wraps(fn)
        @jwt_required()
        def decorated(*args, **kwargs):
            #get_jwt_identity returns the identity (string id). Role is stored
            #in additional claims; fetch it from get_jwt().
            from flask_jwt_extended import get_jwt
            claims = get_jwt()
            role = claims.get("role")
            if role != required_role:
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

# GET ALL ENTRIES IN SITE EVENTS TABLE
@app.route("/api/get_site_events")
def get_site_events():
    siteevents = SiteEvent.query.all()
    return jsonify([
        {
            "id": s.id,
            "site_name": s.site_name,
            "on_partnership_tracker": s.on_partnership_tracker,
            "location_on_tracker": s.location_on_tracker,
            "contact_name": s.contact_name,
            "contact_method": s.contact_method,
            "physical_address": s.physical_address,
            "target_population": s.target_population,
            "offer_outreach_frequency": s.offer_outreach_frequency,
            "next_event_datetime": s.next_event_datetime,
            "open_to_public": s.open_to_public,
            "site_type": s.site_type
        } for s in siteevents
    ])
    
#GET NOTES FOR AN ENTRY
@app.route("/api/get_notes/<string:object_type>/<int:object_id>/notes", methods=["GET"])
def get_notes(object_type, object_id):
    # Fetch all notes matching this table and entry
    notes = Note.query.filter_by(object_type=object_type, object_id=object_id)\
                      .order_by(Note.created_at.desc()).all()

    return jsonify([
        {
            "id": n.id,
            "author": n.author,
            "note_text": n.note_text,
            "created_at": n.created_at.isoformat(),
            "updated_at": n.updated_at.isoformat() if n.updated_at else n.created_at.isoformat()
        } for n in notes
    ])
    
#____________________________________________________________________________________________________________

#ADD A DUMMY DATA FOR POTENTIAL PARTNERSHIPS
@app.route("/api/add-simple-partner", methods=["POST"])
def add_simple_partner():
    existing = PotentialPartnerships.query.filter_by(name="Community Partner A").first()
    if existing:
        return {"message": "Already exists."}

    partner = PotentialPartnerships(
        name="Community Partner A",
        county="County 1",
        status="current",
        contact_date="2025-1-10",
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
@jwt_required()
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
    
    user_id = int(get_jwt_identity())   # convert string ID to int
    staff_user = Staff.query.get(user_id)
    username = staff_user.username if staff_user else "Unknown User"

    # Now log the creation
    log_change(new_event, user_id=user_id, action="CREATE")
    
    
    # --- If a note was provided, create it ---
    note_text = data.get("notes")
    new_note = None
    if note_text and note_text.strip():
        new_note = Note(
            object_id=new_event.id,
            object_type="outreachevents",
            author=username,
            note_text=note_text.strip()
        )
        db.session.add(new_note)
        db.session.commit()

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
@jwt_required()
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
    
    user_id = int(get_jwt_identity())   # convert string ID to int
    staff_user = Staff.query.get(user_id)
    username = staff_user.username if staff_user else "Unknown User"
    
    # Now log the creation
    log_change(new_event, user_id=user_id, action="CREATE")
    
    # --- If a note was provided, create it ---
    note_text = data.get("notes")
    new_note = None
    if note_text and note_text.strip():
        new_note = Note(
            object_id=new_event.id,
            object_type="seasonalevents",
            author=username,
            note_text=note_text.strip()
        )
        db.session.add(new_note)
        db.session.commit()
    
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
@jwt_required()
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
    
    user_id = int(get_jwt_identity())   # convert string ID to int
    staff_user = Staff.query.get(user_id)
    username = staff_user.username if staff_user else "Unknown User"
    
    # Now log the creation
    log_change(new_partner, user_id=user_id, action="CREATE")
    
    
    # --- If a note was provided, create it ---
    note_text = data.get("notes")
    new_note = None
    if note_text and note_text.strip():
        new_note = Note(
            object_id=new_partner.id,
            object_type="potentialpartnerships",
            author=username,
            note_text=note_text.strip()
        )
        db.session.add(new_note)
        db.session.commit()
    
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
@jwt_required()
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
    
    user_id = int(get_jwt_identity())   # convert string ID to int
    staff_user = Staff.query.get(user_id)
    username = staff_user.username if staff_user else "Unknown User"
    
    
    # --- If a note was provided, create it ---
    note_text = data.get("notes")
    new_note = None
    if note_text and note_text.strip():
        new_note = Note(
            object_id=new_entry.id,
            object_type="notpotentialpartnerships",
            author=username,
            note_text=note_text.strip()
        )
        db.session.add(new_note)
        db.session.commit()
    
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
@jwt_required()
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
    
    user_id = int(get_jwt_identity())   # convert string ID to int
    staff_user = Staff.query.get(user_id)
    username = staff_user.username if staff_user else "Unknown User"
    
    # Now log the creation
    log_change(new_update, user_id=user_id, action="CREATE")
    
    
    
    # --- If a note was provided, create it ---
    note_text = data.get("notes")
    new_note = None
    if note_text and note_text.strip():
        new_note = Note(
            object_id=new_update.id,
            object_type="monthlyupdates",
            author=username,
            note_text=note_text.strip()
        )
        db.session.add(new_note)
        db.session.commit()
    
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
    

# UPDATE EXISTING ENTRY IN MonthlyUpdates TABLE
@app.route("/api/update_monthly_update/<int:update_id>", methods=["OPTIONS"])
def update_monthly_update_options(update_id):
    return ("", 200)


@app.route("/api/update_monthly_update/<int:update_id>", methods=["PUT"])
@jwt_required()
def update_monthly_update(update_id):
    data = request.get_json() or {}
    update_record = MonthlyUpdates.query.get(update_id)

    if not update_record:
        return jsonify({"error": "Monthly update not found"}), 404

    previous_state = model_to_dict(update_record)

    update_record.month_year = data.get("month_year", update_record.month_year)
    update_record.major_findings = data.get("major_findings", update_record.major_findings)
    update_record.barriers_and_solutions = data.get(
        "barriers_and_solutions", update_record.barriers_and_solutions
    )
    update_record.notes = data.get("notes", update_record.notes)

    db.session.commit()

    user_id = int(get_jwt_identity())
    log_change(update_record, user_id=user_id, action="UPDATE", previous_instance=previous_state)

    return jsonify({
        "message": "Monthly update updated successfully.",
        "update": {
            "id": update_record.id,
            "month_year": update_record.month_year,
            "major_findings": update_record.major_findings,
            "barriers_and_solutions": update_record.barriers_and_solutions,
            "notes": update_record.notes
        }
    }), 200


# ADD ENTRY TO A COUNTY TABLE
@app.route("/api/add_county_entry", methods=["POST"])
@jwt_required()
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
    
    user_id = int(get_jwt_identity())   # convert string ID to int
    staff_user = Staff.query.get(user_id)
    username = staff_user.username if staff_user else "Unknown User"
    
    # Now log the creation
    log_change(new_entry, user_id=user_id, action="CREATE")
    
    
    # --- If a note was provided, create it ---
    note_text = data.get("notes")
    new_note = None
    if note_text and note_text.strip():
        new_note = Note(
            object_id=new_entry.id,
            object_type=table_name,
            author=username,
            note_text=note_text.strip()
        )
        db.session.add(new_note)
        db.session.commit()

    return jsonify({
        "message": f"Entry added to '{county_name}' table successfully.",
        "entry": {column.name: getattr(new_entry, column.name) for column in new_entry.__table__.columns}
    })
    
    
# ADD ENTRY TO SiteEvent TABLE (and create a user-added Note if provided)
@app.route("/api/add_site_event", methods=["POST"])
@jwt_required()
def add_site_event():
    data = request.json

    # --- Create the SiteEvent record ---
    new_site_event = SiteEvent(
        site_name=data.get("site_name"),
        on_partnership_tracker=data.get("on_partnership_tracker", False),
        location_on_tracker=data.get("location_on_tracker"),
        contact_name=data.get("contact_name"),
        contact_method=data.get("contact_method"),
        physical_address=data.get("physical_address"),
        target_population=data.get("target_population"),
        offer_outreach_frequency=data.get("offer_outreach_frequency"),
        next_event_datetime=data.get("next_event_datetime"),
        open_to_public=data.get("open_to_public", False),
        site_type=data.get("site_type")
    )

    db.session.add(new_site_event)
    db.session.commit()

    # --- Log the creation ---
    user_id = int(get_jwt_identity())   # convert string ID to int
    staff_user = Staff.query.get(user_id)
    username = staff_user.username if staff_user else "Unknown User"

    log_change(new_site_event, user_id=user_id, action="CREATE")

    # --- If a note was provided, create it ---
    note_text = data.get("notes")
    new_note = None
    if note_text and note_text.strip():
        new_note = Note(
            object_id=new_site_event.id,
            object_type="siteevents",
            author=username,
            note_text=note_text.strip()
        )
        db.session.add(new_note)
        db.session.commit()

    # --- Response ---
    response = {
        "message": "Site event added successfully.",
        "site_event": {
            "id": new_site_event.id,
            "site_name": new_site_event.site_name,
            "on_partnership_tracker": new_site_event.on_partnership_tracker,
            "location_on_tracker": new_site_event.location_on_tracker,
            "contact_name": new_site_event.contact_name,
            "contact_method": new_site_event.contact_method,
            "physical_address": new_site_event.physical_address,
            "target_population": new_site_event.target_population,
            "offer_outreach_frequency": new_site_event.offer_outreach_frequency,
            "next_event_datetime": new_site_event.next_event_datetime,
            "open_to_public": new_site_event.open_to_public,
            "site_type": new_site_event.site_type
        }
    }

    if new_note:
        response["note"] = {
            "id": new_note.id,
            "author": new_note.author,
            "note_text": new_note.note_text,
            "created_at": new_note.created_at
        }

    return jsonify(response)

    
# ADD NOTES TO AN ENTRY    
@app.route("/api/add_note_to_entry/<string:object_type>/<int:object_id>/notes", methods=["POST"])
@jwt_required()
def add_note(object_type, object_id):
    data = request.get_json()

    # Basic table name validation (prevents SQL injection)
    if not re.match(r"^[A-Za-z0-9_]+$", object_type):
        return jsonify({"error": "Invalid table name"}), 400

    # Make sure note text is provided
    note_text = data.get("note_text", "").strip()
    if not note_text:
        return jsonify({"error": "Note text is required"}), 400

    # Get identity from JWT
    identity = get_jwt_identity()

    # Default author
    author = data.get("author")
    if not author:
        # Try to resolve username from the database
        try:
            user_id = int(get_jwt_identity())   # convert string ID to int
            staff_user = Staff.query.get(user_id)
            author = staff_user.username if staff_user else "Unknown User"
        except (ValueError, TypeError):
            author = "Unknown User"

    # Create note
    new_note = Note(
        object_id=object_id,
        object_type=object_type,
        author=author,
        note_text=note_text
    )

    db.session.add(new_note)
    db.session.commit()

    return jsonify({
        "message": f"Note added to {object_type} entry {object_id} successfully.",
        "author": author
    }), 201


# UPDATE A SPECIFIC NOTE
@app.route("/api/update_note/<int:note_id>", methods=["PUT"])
@jwt_required()
def update_note(note_id):
    data = request.get_json()
    
    note = Note.query.get(note_id)
    if not note:
        return jsonify({"error": "Note not found"}), 404
    
    # Get current user info
    try:
        user_id = int(get_jwt_identity())
        current_user = Staff.query.get(user_id)
        if not current_user:
            return jsonify({"error": "User not found"}), 404
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid user"}), 401
    
    # Check if user is the author or has admin/owner role
    if note.author != current_user.username and current_user.role not in ["admin", "owner"]:
        return jsonify({"error": "You are not authorized to edit this note"}), 403
    
    # Update note text if provided
    note_text = data.get("note_text", "").strip()
    if not note_text:
        return jsonify({"error": "Note text is required"}), 400
    
    note.note_text = note_text
    
    db.session.commit()
    
    return jsonify({
        "message": "Note updated successfully",
        "note": {
            "id": note.id,
            "note_text": note.note_text,
            "author": note.author,
            "created_at": note.created_at.isoformat(),
            "updated_at": note.updated_at.isoformat()
        }
    }), 200


# DELETE A SPECIFIC NOTE
@app.route("/api/delete_note/<int:note_id>", methods=["DELETE"])
@jwt_required()
def delete_note(note_id):
    note = Note.query.get(note_id)
    if not note:
        return jsonify({"error": "Note not found"}), 404
    
    # Get current user info
    try:
        user_id = int(get_jwt_identity())
        current_user = Staff.query.get(user_id)
        if not current_user:
            return jsonify({"error": "User not found"}), 404
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid user"}), 401
    
    # Only admins or owners can delete notes
    if note.author != current_user.username and current_user.role not in ["admin", "owner"]:
        return jsonify({"error": "Unauthorized. Admin or Owner role required"}), 403
    
    db.session.delete(note)
    db.session.commit()
    
    return jsonify({"message": "Note deleted successfully"}), 200


#_____________________________________________________________________________________________________________________        
    
#UPDATE ENTRY IN OutreachEvents TABLE    
@app.route("/api/update_outreach_event/<int:id>", methods=["PUT"])
@jwt_required()
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
    
    user_id = int(get_jwt_identity())   # convert string ID to int
    staff_user = Staff.query.get(user_id)
    username = staff_user.username if staff_user else "Unknown User"
    
    log_change(
        instance=event,
        user_id=user_id,  # Replace with current logged-in user ID
        action="UPDATE",
        previous_instance=previous_snapshot  # use snapshot for previous_data
    )
    
    
    # --- If the staff added a note, save it to the Notes table ---
    note_text = data.get("notes")
    new_note = None
    if note_text and note_text.strip():
        new_note = Note(
            object_id=event.id,
            object_type="outreachevents",
            author=username,
            note_text=note_text.strip(),
        )
        db.session.add(new_note)
        db.session.commit()

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
@jwt_required()
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
    
    user_id = int(get_jwt_identity())   # convert string ID to int
    staff_user = Staff.query.get(user_id)
    username = staff_user.username if staff_user else "Unknown User"
    
    log_change(
        instance=event,
        user_id=user_id,  # Replace with current logged-in user ID
        action="UPDATE",
        previous_instance=previous_snapshot  # use snapshot for previous_data
    )
    
    
    # --- If the staff added a note, save it to the Notes table ---
    note_text = data.get("notes")
    new_note = None
    if note_text and note_text.strip():
        new_note = Note(
            object_id=event.id,
            object_type="seasonalevents",
            author=username,
            note_text=note_text.strip(),
        )
        db.session.add(new_note)
        db.session.commit()

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
@jwt_required()
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
    partner.contact_date = data.get("contact_date", partner.contact_date)
    partner.next_contact = data.get("next_contact", partner.next_contact)
    partner.notes = data.get("notes", partner.notes)

    db.session.commit()
    
    user_id = int(get_jwt_identity())   # convert string ID to int
    staff_user = Staff.query.get(user_id)
    username = staff_user.username if staff_user else "Unknown User"
    
    log_change(
        instance=partner,
        user_id=user_id,  # Replace with current logged-in user ID
        action="UPDATE",
        previous_instance=previous_snapshot  # use snapshot for previous_data
    )
    
    
    # --- If the staff added a note, save it to the Notes table ---
    note_text = data.get("notes")
    new_note = None
    if note_text and note_text.strip():
        new_note = Note(
            object_id=partner.id,
            object_type="potentialpartnerships",
            author=username,
            note_text=note_text.strip(),
        )
        db.session.add(new_note)
        db.session.commit()

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
@jwt_required()
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
    partner.contact_date = data.get("contact_date", partner.contact_date)
    partner.contact_attempt = data.get("contact_attempt", partner.contact_attempt)
    partner.notes = data.get("notes", partner.notes)

    db.session.commit()
    
    user_id = int(get_jwt_identity())   # convert string ID to int
    staff_user = Staff.query.get(user_id)
    username = staff_user.username if staff_user else "Unknown User"
    
    log_change(
        instance=partner,
        user_id=user_id,  # Replace with current logged-in user ID
        action="UPDATE",
        previous_instance=previous_snapshot  # use snapshot for previous_data
    )
    
    
    # --- If the staff added a note, save it to the Notes table ---
    note_text = data.get("notes")
    new_note = None
    if note_text and note_text.strip():
        new_note = Note(
            object_id=partner.id,
            object_type="notpotentialpartnerships",
            author=username,
            note_text=note_text.strip(),
        )
        db.session.add(new_note)
        db.session.commit()

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
@jwt_required()
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
    
    user_id = int(get_jwt_identity())   # convert string ID to int
    staff_user = Staff.query.get(user_id)
    username = staff_user.username if staff_user else "Unknown User"
    
    log_change(
        instance=entry,
        user_id=user_id,  # Replace with current logged-in user ID
        action="UPDATE",
        previous_instance=previous_snapshot # use snapshot for previous_data
    )
    
    
    # --- If the staff added a note, save it to the Notes table ---
    note_text = data.get("notes")
    new_note = None
    if note_text and note_text.strip():
        new_note = Note(
            object_id=entry.id,
            object_type=table_name,
            author=username,
            note_text=note_text.strip(),
        )
        db.session.add(new_note)
        db.session.commit()

    return jsonify({
        "message": f"Entry with ID {id} in '{county_name}' updated successfully.",
        "entry": {column.name: getattr(entry, column.name) for column in entry.__table__.columns}
    })
    
    
# UPDATE ENTRY IN SiteEvent TABLE (and create a user-added Note if provided)
@app.route("/api/update_site_event/<int:id>", methods=["PUT"])
@jwt_required()
def update_site_event(id):
    data = request.json
    site_event = SiteEvent.query.get(id)
    if not site_event:
        return jsonify({"message": "Site event not found"}), 404

    # Snapshot before update (for your changelog)
    previous_snapshot = model_to_dict(site_event)

    # --- Update the SiteEvent fields ---
    site_event.site_name = data.get("site_name", site_event.site_name)
    site_event.on_partnership_tracker = data.get(
        "on_partnership_tracker", site_event.on_partnership_tracker
    )
    site_event.location_on_tracker = data.get(
        "location_on_tracker", site_event.location_on_tracker
    )
    site_event.contact_name = data.get("contact_name", site_event.contact_name)
    site_event.contact_method = data.get("contact_method", site_event.contact_method)
    site_event.physical_address = data.get("physical_address", site_event.physical_address)
    site_event.target_population = data.get("target_population", site_event.target_population)
    site_event.offer_outreach_frequency = data.get(
        "offer_outreach_frequency", site_event.offer_outreach_frequency
    )
    site_event.next_event_datetime = data.get(
        "next_event_datetime", site_event.next_event_datetime
    )
    site_event.open_to_public = data.get("open_to_public", site_event.open_to_public)
    site_event.site_type = data.get("site_type", site_event.site_type)

    db.session.commit()

    # --- Log the change (your existing audit trail) ---
    user_id = int(get_jwt_identity())   # convert string ID to int
    staff_user = Staff.query.get(user_id)
    username = staff_user.username if staff_user else "Unknown User"

    log_change(
        instance=site_event,
        user_id=user_id,
        action="UPDATE",
        previous_instance=previous_snapshot
    )

    # --- If the staff added a note, save it to the Notes table ---
    note_text = data.get("notes")
    new_note = None
    if note_text and note_text.strip():
        new_note = Note(
            object_id=site_event.id,
            object_type="siteevents",
            author=username,
            note_text=note_text.strip(),
        )
        db.session.add(new_note)
        db.session.commit()

    # --- Response ---
    response = {
        "message": "Site event updated successfully.",
        "site_event": {
            "id": site_event.id,
            "site_name": site_event.site_name,
            "on_partnership_tracker": site_event.on_partnership_tracker,
            "location_on_tracker": site_event.location_on_tracker,
            "contact_name": site_event.contact_name,
            "contact_method": site_event.contact_method,
            "physical_address": site_event.physical_address,
            "target_population": site_event.target_population,
            "offer_outreach_frequency": site_event.offer_outreach_frequency,
            "next_event_datetime": site_event.next_event_datetime,
            "open_to_public": site_event.open_to_public,
            "site_type": site_event.site_type
        }
    }

    if new_note:
        response["note"] = {
            "id": new_note.id,
            "author": new_note.author,
            "note_text": new_note.note_text,
            "created_at": new_note.created_at
        }

    return jsonify(response)

#___________________________________________________________________________________________________________________

# GENERALIZED DELETE ENTRY FUNCTION (with related notes deletion)
@app.route('/api/delete_entry', methods=['DELETE'])
@jwt_required()
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
        'siteevents': SiteEvent,  # optional: include if you'd like it handled here too
    }

    model = model_map.get(table_name.lower())
    if not model:
        return jsonify({'error': 'Invalid table name'}), 400

    # Get entry from database
    entry = db.session.get(model, entry_id)
    if not entry:
        return jsonify({'error': 'Entry not found'}), 404

    try:
        current_user_id = int(get_jwt_identity())
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid user"}), 401

    current_user = Staff.query.get(current_user_id)
    if not current_user:
        return jsonify({"error": "User not found"}), 404

    if current_user.role not in ["admin", "owner"]:
        return jsonify({"error": "Unauthorized. Admin or Owner role required"}), 403

    # Snapshot before deletion for logging
    previous_snapshot = model_to_dict(entry)

    # Log deletion BEFORE removing
    log_change(
        instance=entry,
        user_id=current_user_id,
        action="DELETE",
        previous_instance=previous_snapshot
    )

    # Delete associated notes (if any)
    associated_notes = Note.query.filter_by(
        object_type=table_name.lower(),
        object_id=entry_id
    ).all()
    deleted_notes_count = len(associated_notes)
    for note in associated_notes:
        db.session.delete(note)

    # Delete the main entry
    db.session.delete(entry)
    db.session.commit()

    return jsonify({
        'message': f'Entry and {deleted_notes_count} associated notes deleted successfully',
        'deleted_entry_id': entry_id,
        'deleted_notes_count': deleted_notes_count
    }), 200



# DELETE ENTRY IN SiteEvent TABLE
@app.route("/api/delete_site_event/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_site_event(id):
    try:
        current_user_id = int(get_jwt_identity())
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid user"}), 401

    current_user = Staff.query.get(current_user_id)
    if not current_user:
        return jsonify({"error": "User not found"}), 404

    if current_user.role not in ["admin", "owner"]:
        return jsonify({"error": "Unauthorized. Admin or Owner role required"}), 403

    site_event = SiteEvent.query.get(id)
    if not site_event:
        return jsonify({"message": "Site event not found"}), 404

    # Take snapshot before deletion (for audit log)
    previous_snapshot = model_to_dict(site_event)

    # Delete all notes associated with this SiteEvent
    associated_notes = Note.query.filter_by(
        object_type="siteevents",
        object_id=id
    ).all()
    for note in associated_notes:
        db.session.delete(note)

    # Delete the site event itself
    db.session.delete(site_event)
    db.session.commit()

    # Log deletion
    username = current_user.username if current_user else "Unknown User"

    log_change(
        instance=site_event,
        user_id=current_user_id,
        action="DELETE",
        previous_instance=previous_snapshot
    )

    return jsonify({
        "message": "Site event and all associated notes deleted successfully.",
        "deleted_site_event_id": id,
        "deleted_notes_count": len(associated_notes)
    })
    

# DELETE ENTRY IN A COUNTY TABLE
@app.route("/api/delete_county_entry/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_county_entry(id):
    data = request.json
    county_name = data.get("county_name")

    if not county_name:
        return jsonify({"error": "Missing 'county_name' field"}), 400

    try:
        current_user_id = int(get_jwt_identity())
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid user"}), 401

    current_user = Staff.query.get(current_user_id)
    if not current_user:
        return jsonify({"error": "User not found"}), 404

    if current_user.role not in ["admin", "owner"]:
        return jsonify({"error": "Unauthorized. Admin or Owner role required"}), 403

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
    
    # Log BEFORE deleting (so we still have the instance)
    log_change(
        instance=entry,          # pass the actual entry
        user_id=current_user_id,               # replace with current logged-in user ID
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

