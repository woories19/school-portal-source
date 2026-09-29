/* ERPNext hand-offs. In the live product these actions open the school's ERPNext site; the demo only explains that. */
(function () {
'use strict';
const SP = window.SP, I = SP.icon, esc = SP.esc;

const TARGETS = {
  voucher: ['Print the official fee voucher', 'file', 'Official fee vouchers are Sales Invoices in ERPNext, with the school letterhead, bank details and a scannable payment reference.', 'Sales Invoice → Print'],
  reconcile: ['Reconcile settlements', 'wallet', 'Bank statements, gateway payouts and payment entries are matched in ERPNext\'s accounting module.', 'Bank Reconciliation Statement'],
  coa: ['Chart of Accounts', 'list', 'The school\'s full chart of accounts, cost centres and fiscal years live in ERPNext.', 'Accounting → Chart of Accounts'],
  je: ['Journal Entry', 'pen', 'Manual journal entries, adjustments and write-offs are booked in ERPNext.', 'Accounting → Journal Entry'],
  gl: ['General Ledger', 'book', 'Full transaction-level ledger with drill-down and export.', 'Financial Reports → General Ledger'],
  tb: ['Trial Balance', 'chart', 'Trial balance, balance sheet, and profit & loss statements.', 'Financial Reports → Trial Balance'],
  pe: ['Payment Entry', 'cash', 'Record and allocate payments received against invoices.', 'Accounting → Payment Entry'],
  ar: ['Accounts Receivable', 'users', 'Ageing of outstanding fees across the whole school.', 'Financial Reports → Accounts Receivable']
};
SP.act.erp = d => SP.openModal('erp', { w: d.w });
SP.modals.erp = function (a) {
  const t = TARGETS[a.w] || TARGETS.voucher;
  return '<div class="m-h"><h3>Opens in ERPNext</h3><button class="btn ghost icon" data-act="closeModal">' + I('x') + '</button></div><div class="m-b">' +
    '<div class="erp-box"><span class="ei">' + I(t[1]) + '</span><div><b>' + t[0] + '</b><p>' + t[2] + '</p><code>' + t[3] + '</code></div></div>' +
    '<div class="note">' + I('alert') + '<span><b>Demo only.</b> In the live app this takes you straight to your school\'s ERPNext site, already signed in. ERPNext is not deployed in this demo.</span></div></div>' +
    '<div class="m-f">' + SP.btn('Got it', 'closeModal', { c: 'pri' }) + '</div>';
};

SP.pages['admin.accounting'] = function () {
  const groups = [
    ['Receivables', [['ar', 'Accounts Receivable'], ['pe', 'Payment Entry'], ['reconcile', 'Bank Reconciliation']]],
    ['Ledgers', [['gl', 'General Ledger'], ['coa', 'Chart of Accounts'], ['je', 'Journal Entry']]],
    ['Financial reports', [['tb', 'Trial Balance'], ['gl', 'Profit & Loss'], ['gl', 'Balance Sheet']]]
  ];
  return SP.head('Accounting', 'Powered by ERPNext · fees flow here automatically', '<span class="pill blue">Opens in ERPNext</span>') +
    '<div class="banner">' + I('doc') + '<div><b>Every fee voucher and payment is posted to ERPNext automatically.</b> Day-to-day fee collection stays in this portal; accounting, ledgers and statutory reports open in ERPNext.</div></div>' +
    '<div class="g3">' + groups.map(g => SP.card(g[0], g[1].map(x => '<button class="erp-link" data-act="erp" data-w="' + x[0] + '">' + esc(x[1]) + I('right') + '</button>').join(''))).join('') + '</div>';
};
})();
