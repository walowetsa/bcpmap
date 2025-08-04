export interface AgentData {
    "Emp Name": string;
    "TSA ID": number;
    "Emp Contact #": string;
    "Role": string;
    "Division": string;
    "Department": string;
    "State/Location": string;
    "Manager Name": string;
    "Manager Contact #": string | null;
    "2nd Manager Name": string | null;
    "2nd Manager Contact #": string | null;
    "Emergency Contact Name": string;
    "Emergency Contact Relationship": string;
    "Emergency Contact #": string;
    "PersonalAddress": string;
    "latitude": number;
    "longitude": number;
    "geocode_display_name": string;
    "geocode_success": boolean;
    "geocode_error": string | null;
}