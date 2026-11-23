-- Fulfilment fields on an order. The buyer reads the tracking number; the supplier is where the item was bought and the
-- shipper is the person who moved the order to shipped. Owner: plans/proposals/platform-parity-pixl.md step 1.
ALTER TABLE "ShopOrder"
    ADD COLUMN "trackingNumber" TEXT,
    ADD COLUMN "carrier" TEXT,
    ADD COLUMN "supplier" TEXT,
    ADD COLUMN "shippedById" TEXT;
