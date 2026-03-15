-- supabase/migrations/20260315_add_jhb_coordinates.sql

-- Assign coordinates to Johannesburg venues that were added without them.
-- This allows them to show up in the discovery engine and on the map.

DO $$
BEGIN
    -- 1. Sandton / Kramerville Area
    UPDATE places SET latitude = -26.0924, longitude = 28.0718 WHERE name IN ('Katy''s Palace Bar');
    UPDATE places SET latitude = -26.1076, longitude = 28.0567 WHERE name IN ('Hard Rock Cafe', 'Café 28 Inanda', 'Proud Mary');

    -- 2. Maboneng / City Centre
    UPDATE places SET latitude = -26.2045, longitude = 28.0592 WHERE name IN ('The Living Room', 'Pata Pata', 'Arts on Main', 'Museum Africa', 'The Marabi Club', 'Home of the Bean', 'Cramers Coffee');
    UPDATE places SET latitude = -26.1912, longitude = 28.0350 WHERE name IN ('Kitcheners', 'Kitcheners Carvery Bar', 'The Orbit Jazz Club & Bistro', 'Bannister Hotel Beer Garden', 'Constitution Hill', 'Wits Art Museum', 'Johannesburg Art Gallery');

    -- 3. Melville / Westdene
    UPDATE places SET latitude = -26.1758, longitude = 28.0084 WHERE name IN ('Ratz Bar', 'Cafe de la Crème', 'The Frog Bar', 'Hell''s Kitchen');

    -- 4. Rosebank / Parkhurst / Greenside
    UPDATE places SET latitude = -26.1450, longitude = 28.0439 WHERE name IN ('Marble Restaurant', 'Pantry by Marble', 'Keyes Art Mile', 'Father Coffee');
    UPDATE places SET latitude = -26.1341, longitude = 28.0125 WHERE name IN ('Blind Tiger Café', 'Delta Café', 'Breezeblock');

    -- 5. Parks / Outdoors (Joburg)
    UPDATE places SET latitude = -26.1905, longitude = 28.0620 WHERE name IN ('The Wilds');
    UPDATE places SET latitude = -26.1265, longitude = 28.0205 WHERE name IN ('Delta Park');
    UPDATE places SET latitude = -26.1550, longitude = 28.0550 WHERE name IN ('James & Ethel Gray Park');
    UPDATE places SET latitude = -26.1450, longitude = 28.0350 WHERE name IN ('Mushroom Farm Park');

    -- 6. Catch-all for remaining Johannesburg venues without coordinates
    -- We'll put them near the city center so they at least appear in city-wide searches
    UPDATE places 
    SET latitude = -26.2041 + (random() * 0.05 - 0.025), 
        longitude = 28.0473 + (random() * 0.05 - 0.025)
    WHERE city = 'Johannesburg' AND latitude IS NULL;

END $$;
