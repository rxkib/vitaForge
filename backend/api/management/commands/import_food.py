from django.core.management.base import BaseCommand
from api.models import FoodItem
import openpyxl
import os

class Command(BaseCommand):
    help = "Import FoodTableML.xlsx into FoodItem model."

    def handle(self, *args, **options):
        excel_path = os.path.abspath(
    os.path.join(os.path.dirname(os.getcwd()), "dataset", "FoodTableML.xlsx")
)

        if not os.path.exists(excel_path):
            self.stdout.write(self.style.ERROR(f"File not found: {excel_path}"))
            return

        wb = openpyxl.load_workbook(excel_path)
        sheet = wb.active  # or wb["SheetName"] if you want a specific sheet

        # Uncomment if you want a fresh import each time
        # FoodItem.objects.all().delete()

        row_count = 0
        for row_idx, row in enumerate(sheet.iter_rows(values_only=True)):
            # Skip header row
            if row_idx == 0:
                continue

            # Slice the row to the first 59 columns to avoid "too many values" errors.
            row = row[:59]

            (
                code,
                name,
                region,
                tags,
                vegan,
                vegetarian,
                gluten_free,
                protein_g,
                total_fat_g,
                dietary_fibre_g,
                carbs_g,
                energy_kj,
                vitamin_b1_mg,
                vitamin_b2_mg,
                vitamin_b3_mg,
                vitamin_b5_mg,
                vitamin_b6_mg,
                vitamin_b7_ug,
                vitamin_b9_ug,
                vitamin_c_mg,
                retinol_ug,
                vitamin_d2_ug,
                vitamin_d3_ug,
                alpha_tocopherol_eq_mg,
                vitamin_k1_ug,
                vitamin_k2_ug,
                calcium_mg,
                chromium_mg,
                copper_mg,
                iron_mg,
                magnesium_mg,
                manganese_mg,
                molybdenum_mg,
                phophorous_mg,
                potassium_mg,
                selenium_ug,
                sodium_mg,
                zinc_mg,
                total_available_cho_g,
                total_free_sugars_g,
                lactose_content_g,
                linoleic_mg,
                total_saturated_fatty_acids_mg,
                total_mono_unsat_fatty_acids_mg,
                total_poly_unsat_fatty_acids_mg,
                cholesterol_mg,
                histidine_g,
                isoleucine_g,
                leucine_g,  # Adjust if your model calls this 'luecine_g'
                lysine_g,
                methionine_g,
                cysteine_g,
                phenylalanine_g,
                threonine_g,
                tryptophan_g,
                valine_g,
                total_saturated_fatty_acids_percent,
                total_mono_unsat_fatty_acids_percent,
                total_poly_unsat_fatty_acids_percent
            ) = row

            # Convert numeric 0/1 to booleans
            vegan_bool = (int(vegan) == 1)
            vegetarian_bool = (int(vegetarian) == 1)
            gluten_free_bool = (int(gluten_free) == 1)

            FoodItem.objects.create(
                code=code,
                name=name,
                region=region,
                tags=tags,
                vegan=vegan_bool,
                vegetarian=vegetarian_bool,
                gluten_free=gluten_free_bool,
                protein_g=protein_g,
                total_fat_g=total_fat_g,
                dietary_fibre_g=dietary_fibre_g,
                carbs_g=carbs_g,
                energy_kj=energy_kj,
                vitamin_b1_mg=vitamin_b1_mg,
                vitamin_b2_mg=vitamin_b2_mg,
                vitamin_b3_mg=vitamin_b3_mg,
                vitamin_b5_mg=vitamin_b5_mg,
                vitamin_b6_mg=vitamin_b6_mg,
                vitamin_b7_ug=vitamin_b7_ug,
                vitamin_b9_ug=vitamin_b9_ug,
                vitamin_c_mg=vitamin_c_mg,
                retinol_ug=retinol_ug,
                vitamin_d2_ug=vitamin_d2_ug,
                vitamin_d3_ug=vitamin_d3_ug,
                alpha_tocopherol_eq_mg=alpha_tocopherol_eq_mg,
                vitamin_k1_ug=vitamin_k1_ug,
                vitamin_k2_ug=vitamin_k2_ug,
                calcium_mg=calcium_mg,
                chromium_mg=chromium_mg,
                copper_mg=copper_mg,
                iron_mg=iron_mg,
                magnesium_mg=magnesium_mg,
                manganese_mg=manganese_mg,
                molybdenum_mg=molybdenum_mg,
                phophorous_mg=phophorous_mg,
                potassium_mg=potassium_mg,
                selenium_ug=selenium_ug,
                sodium_mg=sodium_mg,
                zinc_mg=zinc_mg,
                total_available_cho_g=total_available_cho_g,
                total_free_sugars_g=total_free_sugars_g,
                lactose_content_g=lactose_content_g,
                linoleic_mg=linoleic_mg,
                total_saturated_fatty_acids_mg=total_saturated_fatty_acids_mg,
                total_mono_unsat_fatty_acids_mg=total_mono_unsat_fatty_acids_mg,
                total_poly_unsat_fatty_acids_mg=total_poly_unsat_fatty_acids_mg,
                cholesterol_mg=cholesterol_mg,
                histidine_g=histidine_g,
                isoleucine_g=isoleucine_g,
                leucine_g=leucine_g,  # If your model field is spelled differently
                lysine_g=lysine_g,
                methionine_g=methionine_g,
                cysteine_g=cysteine_g,
                phenylalanine_g=phenylalanine_g,
                threonine_g=threonine_g,
                tryptophan_g=tryptophan_g,
                valine_g=valine_g,
                total_saturated_fatty_acids_percent=total_saturated_fatty_acids_percent,
                total_mono_unsat_fatty_acids_percent=total_mono_unsat_fatty_acids_percent,
                total_poly_unsat_fatty_acids_percent=total_poly_unsat_fatty_acids_percent
            )

            row_count += 1

        self.stdout.write(self.style.SUCCESS(f"Imported {row_count} rows."))
