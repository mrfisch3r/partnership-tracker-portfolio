from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from sqlalchemy.dialects.sqlite import JSON
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///database.db"
db = SQLAlchemy(app)

class OutreachEvents(db.Model):
    __tablename__ = "outreachevents"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(20), nullable=True)
    organization_name = db.Column(db.String(200), nullable=True)
    contacts = db.Column(db.Text, nullable=True)
    target_population = db.Column(db.Text, nullable=True)
    event_dates = db.Column(db.String(100), nullable=True)
    reoccuring_event = db.Column(db.String(100), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    
class SeasonalEvents(db.Model):
    __tablename__ = "seasonalevents"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(20), nullable=True)
    organization_name = db.Column(db.String(200), nullable=True)
    contacts = db.Column(db.Text, nullable=True)
    target_population = db.Column(db.Text, nullable=True)
    event_dates = db.Column(db.String(100), nullable=True)
    reoccuring_event = db.Column(db.String(100), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    
class PotentialPartnerships(db.Model):
    __tablename__ = "potentialpartnerships"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(20), nullable=True)
    organization_name = db.Column(db.String(200), nullable=True)
    contacts = db.Column(db.Text, nullable=True)
    target_population = db.Column(db.Text, nullable=True)
    contact_date = db.Column(db.Text, nullable=True)
    next_contact = db.Column(db.Text, nullable=True)
    notes = db.Column(db.Text, nullable=True)
    
class NotPotentialPartnerships(db.Model):
    __tablename__ = "notpotentialpartnerships"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(20), nullable=True)
    organization_name = db.Column(db.String(200), nullable=True)
    contacts = db.Column(db.Text, nullable=True)
    target_population = db.Column(db.Text, nullable=True)
    contact_date = db.Column(db.Text, nullable=True)
    contact_attempt = db.Column(db.Text, nullable=True)
    notes = db.Column(db.Text, nullable=True)
    
class MonthlyUpdates(db.Model):
    __tablename__ = "monthlyupdates"
    id = db.Column(db.Integer, primary_key=True)
    month_year = db.Column(db.String(20), nullable=True)
    major_findings = db.Column(db.Text, nullable=True)
    barriers_and_solutions = db.Column(db.Text, nullable=True)
    notes = db.Column(db.Text, nullable=True)
        
class DynamicCounty(db.Model):
    __abstract__ = True  # Important: tells SQLAlchemy this class is not a table by itself

    id = db.Column(db.Integer, primary_key=True)
    need = db.Column(db.String(20), nullable=True)
    agency = db.Column(db.String(200), nullable=True)
    county = db.Column(db.Text, nullable=True)
    town = db.Column(db.Text, nullable=True)
    contact_name = db.Column(db.Text, nullable=True)
    contact_info = db.Column(db.Text, nullable=True)
    address = db.Column(db.Text, nullable=True)
    hours = db.Column(db.Text, nullable=True)
    referral_process = db.Column(db.Text, nullable=True)
    restrictions = db.Column(db.Text, nullable=True)
    insurance = db.Column(db.Text, nullable=True)
    other = db.Column(db.Text, nullable=True)
    
class ChangeLog(db.Model):
    __tablename__ = "change_log"

    id = db.Column(db.Integer, primary_key=True)
    table_name = db.Column(db.String(100), nullable=False)       # e.g. "MonthlyUpdates" or "FranklinCounty"
    record_id = db.Column(db.Integer, nullable=False)            # the primary key of the changed record
    user_id = db.Column(db.Integer, nullable=False)              # link this to your User table's PK
    action = db.Column(db.String(10), nullable=False)            # CREATE, UPDATE, DELETE
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)  # when the change happened
    previous_data = db.Column(JSON, nullable=True)               # full snapshot before change
    new_data = db.Column(JSON, nullable=True)

class Staff(db.Model):
    __tablename__ = "staff"   

    id = db.Column(
        db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)  # should be a string, not integer
    role = db.Column(db.String(50), nullable=False, default="viewer")  # enforce role size + sensible default
    
    # Hash password before storing
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    # Check hashed password during login
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


#class ContactInfo(db.Model):
    #SEPERATE TABLES FOR CONTACT INFO IN CASE THERE ARE MULTIPLE CONTACTS FOR ONE ENTRY, MAY NOT BE NECESSARY
    #id = db.Column(db.Integer, primary_key=True)
    #name = db.Column(db.String(50), nullable=True)
    #phone = db.Column(db.String(25), nullable=True)  
    #email = db.Column(db.String(100), nullable=True)
    #address = db.Column(db.String(100), nullable=True)
    #type_of_table = db.Column(db.Integer, nullable=False)     #Will be used for searching for duplicate entries in that table 
                                                               #MAY NOT BE NECESSARY
                                                              
    #other = db.Column(db.Text, nullable=True)          #in one table, there was a description that they 
                                                       #didn't know the contact info yet but are trying to get it

    # Foreign keys for multiple tables (one will be used per entry)
    #outreach_event_id = db.Column(db.Integer, db.ForeignKey('outreach_events.id'), nullable=True)
    #seasonal_event_id = db.Column(db.Integer, db.ForeignKey('seasonal_events.id'), nullable=True)
    #potential_partnerships_id = db.Column(db.Integer, db.ForeignKey('potential_partnerships.id'), nullable=True)
    #not_potential_partnerships_id = db.Column(db.Integer, db.ForeignKey('not_potential_partnerships.id'), nullable=True)
    
if __name__ == "__main__":
    with app.app_context():
        db.create_all() 
    print("Database and tables created successfully!")
