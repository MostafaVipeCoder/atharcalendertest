// Google Apps Script for Google Sheets (No Webhook/No ngrok!)
// Adds a custom menu to your Google Sheet for easy manual syncing reminders!

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('📅 Calendar Sync')
    .addItem('🔄 Refresh Data', 'refreshData')
    .addItem('ℹ️ Setup Info', 'showInfo')
    .addToUi();
}

function refreshData() {
  SpreadsheetApp.getUi().alert('Data will be synced automatically within 30 seconds!\n\nThe server checks for updates every 30 seconds.');
}

function showInfo() {
  const html = HtmlService.createHtmlOutput(
    '<h3>How Sync Works:</h3>' +
    '<p>Your calendar server automatically syncs with this sheet every <b>30 seconds</b>!</p>' +
    '<p>Any changes you make here will appear in the calendar within 30 seconds.</p>' +
    '<br><p><b>Column Order:</b></p>' +
    '<ol>' +
    '<li>Project</li>' +
    '<li>Category</li>' +
    '<li>Activity / Sub-Activity</li>' +
    '<li>Start Date</li>' +
    '<li>End Date</li>' +
    '</ol>'
  ).setWidth(400).setHeight(300);
  SpreadsheetApp.getUi().showModalDialog(html, '📅 Calendar Sync Info');
}
