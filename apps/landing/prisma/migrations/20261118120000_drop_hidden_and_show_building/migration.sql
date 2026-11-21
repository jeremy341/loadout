-- Drop the two project columns that no screen sets any more (hide and "show as building" were removed by the always-public decision).
-- AlterTable
ALTER TABLE "Project" DROP COLUMN "hidden",
DROP COLUMN "showBuilding";
