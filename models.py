from flask import Flask
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///database.db"
db = SQLAlchemy(app)

class OutreachEvents(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(20), nullable=True)
    organization_name = db.Column(db.String(200), nullable=True)
    contacts = db.Column(db.Text, nullable=True)
    target_population = db.Column(db.Text, nullable=True)
    event_dates = db.Column(db.String(100), nullable=True)
    reoccuring_event = db.Column(db.String(100), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    
class SeasonalEvents(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(20), nullable=True)
    organization_name = db.Column(db.String(200), nullable=True)
    contacts = db.Column(db.Text, nullable=True)
    target_population = db.Column(db.Text, nullable=True)
    event_dates = db.Column(db.String(100), nullable=True)
    reoccuring_event = db.Column(db.String(100), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    
class PotentialPartnerships(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(20), nullable=True)
    organization_name = db.Column(db.String(200), nullable=True)
    contacts = db.Column(db.Text, nullable=True)
    target_population = db.Column(db.Text, nullable=True)
    contact_date = db.Column(db.Text, nullable=True)
    next_contact = db.Column(db.Text, nullable=True)
    notes = db.Column(db.Text, nullable=True)
    
class NotPotentialPartnerships(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(20), nullable=True)
    organization_name = db.Column(db.String(200), nullable=True)
    contacts = db.Column(db.Text, nullable=True)
    target_population = db.Column(db.Text, nullable=True)
    contact_date = db.Column(db.Text, nullable=True)
    contact_attempt = db.Column(db.Text, nullable=True)
    notes = db.Column(db.Text, nullable=True)
    
class MonthlyUpdates(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    month_year = db.Column(db.String(20), nullable=True)
    major_findings = db.Column(db.Text, nullable=True)
    barriers_and_solutions = db.Column(db.Text, nullable=True)
    notes = db.Column(db.Text, nullable=True)

#class ContactInfo(db.Model):
    #seperate tables for contact info in case there are multiple contacts for one entry, may not be necessary
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
        db.create_all()  # This creates the tables
    print("Database and tables created successfully!")
