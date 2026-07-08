import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

function parseDate(value: any) {
  if (!value) return null;

  // Excel serial date

  if (typeof value === "number") {
    const excelEpoch =
      new Date(
        Date.UTC(
          1899,
          11,
          30
        )
      );

    excelEpoch.setDate(
      excelEpoch.getDate() +
        value
    );

    return excelEpoch
      .toISOString()
      .split("T")[0];
  }

  // DD/MM/YYYY

  if (
    typeof value ===
    "string"
  ) {
    const parts =
      value.split("/");

    if (
      parts.length === 3
    ) {
      return `${parts[2]}-${parts[1].padStart(
        2,
        "0"
      )}-${parts[0].padStart(
        2,
        "0"
      )}`;
    }
  }

  return null;
} {
  if (!value) return null;

  try {
    if (typeof value === "string") {
      const parts = value.split("/");

      if (parts.length === 3) {
        const day = parts[0];
        const month = parts[1];
        const year = parts[2];

        return `${year}-${month.padStart(
          2,
          "0"
        )}-${day.padStart(
          2,
          "0"
        )}`;
      }
    }

    return new Date(value)
      .toISOString()
      .split("T")[0];
  } catch {
    return null;
  }
}

export async function POST(
  req: Request
) {
  try {
    const {
      sheetName,
      flockId,
      rows,
    } = await req.json();

    if (
      !sheetName ||
      !rows
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing data",
        },
        { status: 400 }
      );
    }

    let imported = 0;

    // RECEIPTS RECORD

    if (
      sheetName
        .toLowerCase()
        .includes(
          "receipt"
        )
    ) {
      for (const row of rows) {
        const amount =
          Number(
            row.Amount ||
              row.amount ||
              0
          );

        if (!amount)
          continue;

        await supabaseAdmin
          .from(
            "expenses"
          )
          .insert({
            farm_id:
              row.farm_id ||
              null,

            expense_date:
              parseDate(
                row.Date ||
                  row.date
              ),

            category:
              row.Purpose ||
              "Migration",

            amount,

            notes:
              row.Description ||
              row.Remarks ||
              "",
          });

        imported++;
      }

      return NextResponse.json({
        success: true,
        message: `${imported} expense records imported`,
      });
    }

    // ALL FLOCK SHEETS

    if (!flockId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Flock required",
        },
        { status: 400 }
      );
    }

    const {
      data: flock,
    } =
      await supabaseAdmin
        .from("flocks")
        .select(
          "farm_id"
        )
        .eq(
          "id",
          flockId
        )
        .single();

    if (!flock) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Flock not found",
        },
        { status: 404 }
      );
    }

    const farmId =
      flock.farm_id;

    for (const row of rows) {
      const date =
        parseDate(
          row.Date ||
            row.DATE
        );

      // EGGS

      if (
        row[
          "Total Egg Production"
        ] ||
        row[
          "Egg Production"
        ]
      ) {
        await supabaseAdmin
          .from(
            "egg_production"
          )
          .insert({
            farm_id:
              farmId,

            flock_id:
              flockId,

            production_date:
              date,

            egg_count:
              Number(
                row[
                  "Total Egg Production"
                ] ||
                  row[
                    "Egg Production"
                  ] ||
                  0
              ),

            cracked_eggs:
              Number(
                row[
                  "Cracked Eggs"
                ] || 0
              ),
          });
      }

      // FEED USED

      if (
        row[
          "Feed Used"
        ]
      ) {
        await supabaseAdmin
          .from(
            "feed_records"
          )
          .insert({
            farm_id:
              farmId,

            flock_id:
              flockId,

            feed_date:
              date,

            feed_type:
              "Migration",

            quantity_kg:
              Number(
                row[
                  "Feed Used"
                ]
              ),
          });
      }

      // FEED PURCHASES

      if (
        row[
          "Feed Bought"
        ]
      ) {
        await supabaseAdmin
          .from(
            "feed_inventory"
          )
          .insert({
            farm_id:
              farmId,

            purchase_date:
              date,

            feed_type:
              "Migration",

            quantity_kg:
              Number(
                row[
                  "Feed Bought"
                ]
              ),

            cost: 0,

            supplier:
              "Migration",
          });
      }

      // HEALTH

      if (
        row[
          "Medication Administered"
        ] ||
        row[
          "Medication"
        ]
      ) {
        await supabaseAdmin
          .from(
            "health"
          )
          .insert({
            farm_id:
              farmId,

            flock_id:
              flockId,

            health_date:
              date,

            treatment_name:
              row[
                "Medication Administered"
              ] ||
              row[
                "Medication"
              ],

            category:
              "Treatment",

            cost:
              Number(
                row[
                  "Medication Price"
                ] || 0
              ),

            notes:
              row[
                "Remark"
              ] ||
              row[
                "Comment"
              ] ||
              "",

            isolated_birds:
              Number(
                row[
                  "Number of Isolated Birds"
                ] || 0
              ),
          });
      }

      // MORTALITY

      if (
        row.Mortality
      ) {
        await supabaseAdmin
          .from(
            "mortality"
          )
          .insert({
            farm_id:
              farmId,

            flock_id:
              flockId,

            mortality_date:
              date,

            quantity:
              Number(
                row.Mortality
              ),

            reason:
              "Migration",
          });
      }

      // SALES

      if (
        row[
          "Egg Sold"
        ]
      ) {
        await supabaseAdmin
          .from("sales")
          .insert({
            farm_id:
              farmId,

            sale_date:
              date,

            item_type:
              "Egg Sales",

            quantity:
              Number(
                row[
                  "Egg Sold"
                ]
              ),

            unit_price:
              0,

            total_amount:
              0,

            notes:
              "Migrated",
          });
      }

      if (
        row[
          "Bird Sold"
        ]
      ) {
        await supabaseAdmin
          .from("sales")
          .insert({
            farm_id:
              farmId,

            sale_date:
              date,

            item_type:
              "Live Bird Sales",

            quantity:
              Number(
                row[
                  "Bird Sold"
                ]
              ),

            unit_price:
              0,

            total_amount:
              0,

            notes:
              "Migrated",
          });
      }

      imported++;
    }

    return NextResponse.json({
      success: true,
      message: `${imported} rows imported`,
    });
  } catch (error) {
    console.error(
      "Migration Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Migration failed",
      },
      { status: 500 }
    );
  }
}