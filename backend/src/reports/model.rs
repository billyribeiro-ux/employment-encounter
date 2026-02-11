use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct ReportQuery {
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    #[allow(dead_code)]
    pub client_id: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct ProfitLossReport {
    pub period_start: String,
    pub period_end: String,
    pub revenue: ProfitLossSection,
    pub expenses: ProfitLossSection,
    pub net_income_cents: i64,
}

#[derive(Debug, Serialize)]
pub struct ProfitLossSection {
    pub total_cents: i64,
    pub items: Vec<ReportLineItem>,
}

#[derive(Debug, Serialize)]
pub struct ReportLineItem {
    pub label: String,
    pub amount_cents: i64,
}

#[derive(Debug, Serialize)]
pub struct CashFlowReport {
    pub period_start: String,
    pub period_end: String,
    pub inflows: Vec<CashFlowEntry>,
    pub outflows: Vec<CashFlowEntry>,
    pub net_cash_flow_cents: i64,
}

#[derive(Debug, Serialize)]
pub struct CashFlowEntry {
    pub month: String,
    pub amount_cents: i64,
}
