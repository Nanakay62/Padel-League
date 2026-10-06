"""CSV export formatters for registrations, match results, and financial settlements."""

import csv
import io
from typing import Any


def format_registrations_csv(rows: list[dict[str, Any]]) -> str:
    """Format registrations list into RFC-4180 compliant CSV string."""
    output = io.StringIO()
    writer = csv.writer(output, lineterminator="\r\n")
    writer.writerow(
        [
            "Player Name",
            "Phone",
            "Status",
            "Amount Paid (GHS)",
            "Payment Method",
            "Waitlist Position",
        ]
    )
    for r in rows:
        writer.writerow(
            [
                r.get("name", ""),
                r.get("phone", ""),
                r.get("status", ""),
                r.get("amount_ghs", "0.00"),
                r.get("method", "N/A"),
                r.get("waitlist_position", ""),
            ]
        )
    return output.getvalue()


def format_results_csv(rows: list[dict[str, Any]]) -> str:
    """Format match results list into RFC-4180 compliant CSV string."""
    output = io.StringIO()
    writer = csv.writer(output, lineterminator="\r\n")
    writer.writerow(
        [
            "Round",
            "Court",
            "Team A",
            "Team B",
            "Score A",
            "Score B",
            "Status",
        ]
    )
    for r in rows:
        writer.writerow(
            [
                r.get("round", ""),
                r.get("court", ""),
                r.get("team_a", ""),
                r.get("team_b", ""),
                r.get("score_a", ""),
                r.get("score_b", ""),
                r.get("status", ""),
            ]
        )
    return output.getvalue()


def format_settlement_csv(data: dict[str, Any]) -> str:
    """Format event financial settlement breakdown into RFC-4180 compliant CSV string."""
    output = io.StringIO()
    writer = csv.writer(output, lineterminator="\r\n")
    writer.writerow(["Metric", "Value"])
    writer.writerow(["Total Paid Players", data.get("total_paid_players", 0)])
    writer.writerow(["Total Collected (GHS)", data.get("total_collected_ghs", "0.00")])
    writer.writerow(["Court Costs (GHS)", data.get("court_costs_ghs", "0.00")])
    writer.writerow(["Platform Fees (GHS)", data.get("platform_fees_ghs", "0.00")])
    writer.writerow(
        ["Pending Manual Confirmations", data.get("pending_manual_count", 0)]
    )
    return output.getvalue()
