import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

function parseDate(value: any) {
  if (!value) return null;

  try {
    // Excel serial dates (46057 etc.)
    if (typeof value === "number") {
      const excelEpoch = new Date(
        Date.UTC(1899, 11, 30)
      );

      excelEpoch.setDate(
        excelEpoch.getDate() + value
      );

      return excelEpoch
        .toISOString()
        .split("T")[0];
    }

    // DD/MM/YYYY
    if (typeof value === "string") {
      const parts = value.split("/");

      if (parts.length === 3) {
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
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const {
      sheetName,
      flockId,
      rows,
    } = await req.json();

    if (!sheetName || !rows) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing data",
        },
        { status: 400 }
      );
    }

    // Receipt sheet imports expenses only

    if (
      sheetName
        .toLowerCase()
        .includes("receipt")
    ) {
      let imported = 0;

      for (const row of rows) {
        const amount = Number(
          row.Amount ||
            row.amount ||
            0
        );

        if (!amount) continue;

        await supabaseAdmin
          .from("expenses")
          .insert({
            farm_id: null,
            expense_date: parseDate(
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

    if (!flockId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please select a flock",
        },
        { status: 400 }
      );
    }

    const {
      data: flock,
      error: flockError,
    } = await supabaseAdmin
      .from("flocks")
      .select("farm_id")
      .eq("id", flockId)
      .single();

    if (
      flockError ||
      !flock
    ) {
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

    let imported = 0;

    for (const row of rows) {
      const date = parseDate(
        row.Date ||
          row.DATE
      );

      // Egg Production

      if (
        row[
          "Total Egg Production"
        ] !== undefined
      ) {
        await supabaseAdmin
          .from(
            "egg_production"
          )
          .insert({
            farm_id: farmId,
            flock_id: flockId,
            production_date:
              date,
            egg_count: Number(
              row[
                "Total Egg Production"
              ] || 0
            ),
            cracked_eggs:
              0,
          });
      }

      // Feed Records

      if (
        row[
          "Feed Used"
        ] ||
        row[
          "Feed Used Per Kg"
        ]
      ) {
        const quantity = parseFloat(
          String(
            row[
              "Feed Used"
            ] ||
              row[
                "Feed Used Per Kg"
              ] ||
              "0"
          ).replace(
            /[^0-9.]/g,
            ""
          )
        );

        await supabaseAdmin
          .from(
            "feed_records"
          )
          .insert({
            farm_id: farmId,
            flock_id: flockId,
            feed_date: date,
            feed_type:
              "Migration",
            quantity_kg:
              quantity || 0,
          });
      }

      // Feed Inventory

      if (
        row[
          "Feed Bought"
        ] ||
        row[
          "Feed Bought Per Bag"
        ]
      ) {
        const quantity = parseFloat(
          String(
            row[
              "Feed Bought"
            ] ||
              row[
                "Feed Bought Per Bag"
              ] ||
              "0"
          ).replace(
            /[^0-9.]/g,
            ""
          )
        );

        await supabaseAdmin
          .from(
            "feed_inventory"
          )
          .insert({
            farm_id: farmId,
            purchase_date:
              date,
            feed_type:
              "Migration",
            quantity_kg:
              quantity || 0,
            cost: 0,
            supplier:
              "Migration",
          });
      }

      // Health

      if (
        row[
          "Medication Administered"
        ]
      ) {
        await supabaseAdmin
          .from("health")
          .insert({
            farm_id: farmId,
            flock_id: flockId,
            health_date:
              date,
            treatment_name:
              row[
                "Medication Administered"
              ],
            category:
              "Treatment",
            cost: Number(
              String(
                row[
                  "Medication Price"
                ] || 0
              ).replace(
                /,/g,
                ""
              )
            ),
            notes:
              row[
                "Remark/Comment"
              ] ||
              row[
                "Comment"
              ] ||
              "",
            isolated_birds:
              Number(
                row[
                  "Number Of Isolated Birds"
                ] ||
                  row[
                    "Number of Isolated Birds"
                  ] ||
                  0
              ),
          });
      }

      // Mortality

      if (
        row.Mortality
      ) {
        await supabaseAdmin
          .from(
            "mortality"
          )
          .insert({
            farm_id: farmId,
            flock_id: flockId,
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

      // Bird Sales

      if (
        row[
          "Bird Sold"
        ]
      ) {
        await supabaseAdmin
          .from("sales")
          .insert({
            farm_id: farmId,
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
            unit_price: 0,
            total_amount: 0,
            notes:
              "Migrated",
          });
      }

      // Egg Sales

      if (
        row[
          "Egg Sold"
        ]
      ) {
        await supabaseAdmin
          .from("sales")
          .insert({
            farm_id: farmId,
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
            unit_price: 0,
            total_amount: 0,
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