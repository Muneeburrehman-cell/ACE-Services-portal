# Create Project Feature - Quick Start Guide

## For Admins: Creating a New Project

### Method 1: Create Project with New Client

1. Navigate to **Admin Dashboard** → `/admin/dashboard`
2. Click the **"Create Project"** button (green, with plus icon) in the header
3. The Create Project modal will open
4. **Leave "Select existing client" unchecked**
5. Fill in the client details:
   - **Company Name**: e.g., "ABC Construction Inc."
   - **Contact Person**: e.g., "John Smith"
   - **Email**: Client's email address
   - **Phone**: Client's phone number
6. Fill in project details:
   - **Project Type**: Choose "Cost Estimation" or "Design & Drafting"
   - **Deadline**: Select a date (required)
   - **Scope Description**: Describe the work scope
7. **(Optional)** Fill in:
   - **Salesperson Name**: Who is selling this project
   - **Project Price**: The project cost
8. Click **"Create Project ✓"**
9. Project will appear in the dashboard

### Method 2: Create Project for Existing Client

1. Click **"Create Project"** button
2. **Check "Select existing client"**
3. The **Company Name** field becomes a dropdown
4. Select the existing client company
5. **Contact person, email, and phone auto-populate** from previous records
6. You can edit these fields if needed
7. Fill in project details (same as Method 1)
8. Click **"Create Project ✓"**

### Form Requirements

**Always Required:**
- ✓ Company Name (or select from existing)
- ✓ Contact Person
- ✓ Email (valid email format)
- ✓ Phone
- ✓ Project Type
- ✓ Deadline (date picker)
- ✓ Scope Description

**Optional:**
- Salesperson Name
- Project Price

## Filtering Projects by Client

### Using the Client Filter

1. In the **Filters & Department Selection** section
2. Look for **"Filter by Client"** dropdown (below department tabs)
3. Select a client company name from the dropdown
4. The dashboard will show **only projects for that client**
5. To clear the filter, click the **"Clear Filter"** button

### Combining Filters

You can use multiple filters together:
- **Department Filter**: Estimation / Design & Drafting / All
- **Client Filter**: Select specific client
- **Status Filter**: New Intake / Proposal / In Progress / etc.
- **Search**: Reference number / Company / Salesperson

Example workflow:
1. Filter by client: "ABC Construction Inc."
2. Filter by department: "Cost Estimation"
3. Filter by status: "New Intake"
4. Result: Shows only new estimation jobs for ABC Construction

## Integration with Existing Workflow

### What Happens After Creating a Project?

1. **Project Status**: Automatically set to "New Intake"
2. **Admin Notification**: Email sent to admin with project details
3. **Audit Log**: Creation event recorded in audit trail
4. **Dashboard**: Project appears immediately in the project list
5. **Next Step**: Admin can assign to an engineer

### Assigning an Engineer

1. Find the newly created project in the dashboard
2. Click **"+ Assign Engineer"** in the "Assigned Engineer" column
3. Select engineer, deadline, priority, and instructions
4. Click **"Confirm Assignment ✓"**

## Tips & Best Practices

✓ **Use existing clients** to maintain consistency
✓ **Always set a deadline** - it's required and helps with scheduling
✓ **Include detailed scope** - helps engineers understand requirements
✓ **Add salesperson name** - tracks who brought in the business
✓ **Set accurate price** - used for reporting and metrics

## Troubleshooting

**Issue: "Select existing client" won't show up**
- Need to have at least one project in the system for it to work
- Try refreshing the page

**Issue: Client details not auto-populating**
- Clear the selected client and select again
- Refresh the page

**Issue: "Create Project" button not visible**
- Verify you have admin role
- Check that JavaScript is enabled
- Try refreshing the page

**Issue: Form won't submit**
- Check for red error messages under fields
- Ensure deadline is set (required field)
- Ensure email is in valid format (user@example.com)

## Related Features

- **Manage Users**: `/admin/users` - Add/edit engineers and other roles
- **Project Dashboard**: `/admin/dashboard` - View and manage all projects
- **Project Details**: Click "Manage Desk →" on any project for full details
- **Export Excel**: "Download Weekly Excel" button - Export projects for reporting

## Support

If you encounter issues:
1. Check the error message in the toast notification (top right)
2. Verify all required fields are filled
3. Try refreshing the page
4. Contact system administrator if problem persists
