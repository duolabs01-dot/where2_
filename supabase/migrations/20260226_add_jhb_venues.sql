-- supabase/migrations/20260226_add_jhb_venues.sql

DO $$
DECLARE
    v_place_id UUID;
BEGIN
    -- 1. Katy's Palace Bar
    SELECT id INTO v_place_id FROM places WHERE name = 'Katy''s Palace Bar';
    IF v_place_id IS NULL THEN
        INSERT INTO places (name, category, city, description, is_24_7)
        VALUES ('Katy''s Palace Bar', 'Bar', 'Johannesburg', 'Historic spot; frequent events.', false)
        RETURNING id INTO v_place_id;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
        INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
        VALUES 
            (v_place_id, 3, '17:00:00', '02:00:00'),
            (v_place_id, 4, '17:00:00', '02:00:00'),
            (v_place_id, 5, '17:00:00', '02:00:00'),
            (v_place_id, 6, '17:00:00', '02:00:00');
    END IF;

    -- 2. The Living Room (Maboneng)
    SELECT id INTO v_place_id FROM places WHERE name = 'The Living Room';
    IF v_place_id IS NULL THEN
        INSERT INTO places (name, category, city, description, is_24_7)
        VALUES ('The Living Room', 'Bar', 'Johannesburg', 'Rooftop bar/café; urban vibe.', false)
        RETURNING id INTO v_place_id;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
        INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
        VALUES 
            (v_place_id, 1, '10:00:00', '22:00:00'),
            (v_place_id, 2, '10:00:00', '22:00:00'),
            (v_place_id, 3, '10:00:00', '22:00:00'),
            (v_place_id, 4, '10:00:00', '22:00:00'),
            (v_place_id, 5, '10:00:00', '22:00:00'),
            (v_place_id, 6, '09:00:00', '00:00:00'),
            (v_place_id, 7, '09:00:00', '00:00:00');
    END IF;

    -- 3. Ratz Bar (Melville)
    SELECT id INTO v_place_id FROM places WHERE name = 'Ratz Bar';
    IF v_place_id IS NULL THEN
        INSERT INTO places (name, category, city, description, is_24_7)
        VALUES ('Ratz Bar', 'Bar', 'Johannesburg', 'Dive bar; cross-section crowd.', false)
        RETURNING id INTO v_place_id;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
        INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
        VALUES 
            (v_place_id, 1, '12:00:00', '02:00:00'),
            (v_place_id, 2, '12:00:00', '02:00:00'),
            (v_place_id, 3, '12:00:00', '02:00:00'),
            (v_place_id, 4, '12:00:00', '02:00:00'),
            (v_place_id, 5, '12:00:00', '02:00:00'),
            (v_place_id, 6, '12:00:00', '02:00:00'),
            (v_place_id, 7, '12:00:00', '02:00:00');
    END IF;

    -- 4. Blind Tiger Café (Parkview)
    SELECT id INTO v_place_id FROM places WHERE name = 'Blind Tiger Café';
    IF v_place_id IS NULL THEN
        INSERT INTO places (name, category, city, description, is_24_7)
        VALUES ('Blind Tiger Café', 'Bar', 'Johannesburg', 'Neighborhood bar; trendy.', false)
        RETURNING id INTO v_place_id;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
        INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
        VALUES 
            (v_place_id, 2, '08:00:00', '22:00:00'),
            (v_place_id, 3, '08:00:00', '22:00:00'),
            (v_place_id, 4, '08:00:00', '22:00:00'),
            (v_place_id, 5, '08:00:00', '22:00:00'),
            (v_place_id, 6, '08:00:00', '22:00:00'),
            (v_place_id, 7, '08:00:00', '18:00:00');
    END IF;

    -- 5. Delta Café (Craighall)
    SELECT id INTO v_place_id FROM places WHERE name = 'Delta Café';
    IF v_place_id IS NULL THEN
        INSERT INTO places (name, category, city, description, is_24_7)
        VALUES ('Delta Café', 'Cafe', 'Johannesburg', 'Garden café; family-friendly.', false)
        RETURNING id INTO v_place_id;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
        INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
        VALUES 
            (v_place_id, 1, '07:00:00', '17:00:00'),
            (v_place_id, 2, '07:00:00', '17:00:00'),
            (v_place_id, 3, '07:00:00', '17:00:00'),
            (v_place_id, 4, '07:00:00', '17:00:00'),
            (v_place_id, 5, '07:00:00', '17:00:00'),
            (v_place_id, 6, '07:00:00', '17:00:00'),
            (v_place_id, 7, '07:00:00', '17:00:00');
    END IF;

    -- 6. Breezeblock (Brixton)
    SELECT id INTO v_place_id FROM places WHERE name = 'Breezeblock';
    IF v_place_id IS NULL THEN
        INSERT INTO places (name, category, city, description, is_24_7)
        VALUES ('Breezeblock', 'Cafe', 'Johannesburg', 'Homey café; artistic.', false)
        RETURNING id INTO v_place_id;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
        INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
        VALUES 
            (v_place_id, 3, '08:00:00', '16:00:00'),
            (v_place_id, 4, '08:00:00', '16:00:00'),
            (v_place_id, 5, '08:00:00', '16:00:00'),
            (v_place_id, 6, '08:00:00', '16:00:00'),
            (v_place_id, 7, '08:00:00', '16:00:00');
    END IF;

    -- 7. Cafe de la Crème (Melville) - UPDATE EXISTING
    SELECT id INTO v_place_id FROM places WHERE name = 'Cafe de la Crème';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '07:00:00', '18:00:00'),
                (v_place_id, 2, '07:00:00', '18:00:00'),
                (v_place_id, 3, '07:00:00', '18:00:00'),
                (v_place_id, 4, '07:00:00', '18:00:00'),
                (v_place_id, 5, '07:00:00', '18:00:00'),
                (v_place_id, 6, '07:00:00', '18:00:00'),
                (v_place_id, 7, '08:00:00', '17:00:00');
        END IF;
    END IF;

    -- 8. Café 28 Inanda (Sandton)
    SELECT id INTO v_place_id FROM places WHERE name = 'Café 28 Inanda';
    IF v_place_id IS NULL THEN
        INSERT INTO places (name, category, city, description, is_24_7)
        VALUES ('Café 28 Inanda', 'Cafe', 'Johannesburg', 'Pizza-focused; golf views.', false)
        RETURNING id INTO v_place_id;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
        INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
        VALUES 
            (v_place_id, 1, '07:00:00', '17:00:00'),
            (v_place_id, 2, '07:00:00', '17:00:00'),
            (v_place_id, 3, '07:00:00', '17:00:00'),
            (v_place_id, 4, '07:00:00', '17:00:00'),
            (v_place_id, 5, '07:00:00', '17:00:00'),
            (v_place_id, 6, '08:00:00', '15:00:00'),
            (v_place_id, 7, '08:00:00', '15:00:00');
    END IF;

    -- 9. Delta Park (Randburg)
    SELECT id INTO v_place_id FROM places WHERE name = 'Delta Park';
    IF v_place_id IS NULL THEN
        INSERT INTO places (name, category, city, description, is_24_7)
        VALUES ('Delta Park', 'Park', 'Johannesburg', 'Urban park; trails.', true);
    ELSE
        UPDATE places SET is_24_7 = true WHERE id = v_place_id;
    END IF;

    -- 10. The Wilds (Houghton) - UPDATE EXISTING
    SELECT id INTO v_place_id FROM places WHERE name = 'The Wilds';
    IF v_place_id IS NOT NULL THEN
        UPDATE places SET description = 'Nature reserve; hikes.' WHERE id = v_place_id;
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '06:00:00', '18:00:00'),
                (v_place_id, 2, '06:00:00', '18:00:00'),
                (v_place_id, 3, '06:00:00', '18:00:00'),
                (v_place_id, 4, '06:00:00', '18:00:00'),
                (v_place_id, 5, '06:00:00', '18:00:00'),
                (v_place_id, 6, '06:00:00', '18:00:00'),
                (v_place_id, 7, '06:00:00', '18:00:00');
        END IF;
    END IF;

    -- 11. Museum Africa (Newtown)
    SELECT id INTO v_place_id FROM places WHERE name = 'Museum Africa';
    IF v_place_id IS NULL THEN
        INSERT INTO places (name, category, city, description, is_24_7)
        VALUES ('Museum Africa', 'Museum', 'Johannesburg', 'History museum.', false)
        RETURNING id INTO v_place_id;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
        INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
        VALUES 
            (v_place_id, 2, '09:00:00', '17:00:00'),
            (v_place_id, 3, '09:00:00', '17:00:00'),
            (v_place_id, 4, '09:00:00', '17:00:00'),
            (v_place_id, 5, '09:00:00', '17:00:00'),
            (v_place_id, 6, '09:00:00', '17:00:00'),
            (v_place_id, 7, '09:00:00', '17:00:00');
    END IF;

    -- 12. Johannesburg Art Gallery (Joubert Park)
    SELECT id INTO v_place_id FROM places WHERE name = 'Johannesburg Art Gallery';
    IF v_place_id IS NULL THEN
        INSERT INTO places (name, category, city, description, is_24_7)
        VALUES ('Johannesburg Art Gallery', 'Art Gallery', 'Johannesburg', 'Art-focused.', false)
        RETURNING id INTO v_place_id;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
        INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
        VALUES 
            (v_place_id, 2, '10:00:00', '17:00:00'),
            (v_place_id, 3, '10:00:00', '17:00:00'),
            (v_place_id, 4, '10:00:00', '17:00:00'),
            (v_place_id, 5, '10:00:00', '17:00:00'),
            (v_place_id, 6, '10:00:00', '17:00:00'),
            (v_place_id, 7, '10:00:00', '17:00:00');
    END IF;

    -- 13. Hard Rock Cafe
    SELECT id INTO v_place_id FROM places WHERE name = 'Hard Rock Cafe';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '11:30:00', '23:45:00'),
                (v_place_id, 2, '11:30:00', '23:45:00'),
                (v_place_id, 3, '11:30:00', '23:45:00'),
                (v_place_id, 4, '11:30:00', '23:45:00'),
                (v_place_id, 5, '11:30:00', '02:00:00'),
                (v_place_id, 6, '11:30:00', '02:00:00'),
                (v_place_id, 7, '11:30:00', '23:45:00');
        END IF;
    END IF;

    -- 14. Harrie's Pancakes
    SELECT id INTO v_place_id FROM places WHERE name = 'Harrie''s Pancakes';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '09:00:00', '16:00:00'),
                (v_place_id, 2, '09:00:00', '16:00:00'),
                (v_place_id, 3, '09:00:00', '16:00:00'),
                (v_place_id, 4, '09:00:00', '16:00:00'),
                (v_place_id, 5, '09:00:00', '16:00:00'),
                (v_place_id, 6, '09:00:00', '16:00:00'),
                (v_place_id, 7, '09:00:00', '16:00:00');
        END IF;
    END IF;

    -- 15. Harrington's Cocktail Lounge
    SELECT id INTO v_place_id FROM places WHERE name = 'Harrington''s Cocktail Lounge';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 3, '17:00:00', '02:00:00'),
                (v_place_id, 4, '17:00:00', '02:00:00'),
                (v_place_id, 5, '17:00:00', '02:00:00'),
                (v_place_id, 6, '17:00:00', '02:00:00');
        END IF;
    END IF;

    -- 16. The Frog Bar
    SELECT id INTO v_place_id FROM places WHERE name = 'The Frog Bar';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 2, '12:00:00', '22:00:00'),
                (v_place_id, 3, '12:00:00', '22:00:00'),
                (v_place_id, 4, '12:00:00', '22:00:00'),
                (v_place_id, 5, '09:00:00', '00:00:00'),
                (v_place_id, 6, '09:00:00', '00:00:00');
        END IF;
    END IF;

    -- 17. JaJa Tea Garden
    SELECT id INTO v_place_id FROM places WHERE name = 'JaJa Tea Garden';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '08:00:00', '16:00:00'),
                (v_place_id, 2, '08:00:00', '16:00:00'),
                (v_place_id, 3, '08:00:00', '16:00:00'),
                (v_place_id, 4, '08:00:00', '16:00:00'),
                (v_place_id, 5, '08:00:00', '16:00:00'),
                (v_place_id, 6, '08:00:00', '16:00:00');
        END IF;
    END IF;

    -- 18. Hatfield Square
    SELECT id INTO v_place_id FROM places WHERE name = 'Hatfield Square';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '08:00:00', '17:00:00'),
                (v_place_id, 2, '08:00:00', '17:00:00'),
                (v_place_id, 3, '08:00:00', '17:00:00'),
                (v_place_id, 4, '08:00:00', '17:00:00'),
                (v_place_id, 5, '08:00:00', '17:00:00'),
                (v_place_id, 6, '08:00:00', '17:00:00'),
                (v_place_id, 7, '08:00:00', '17:00:00');
        END IF;
    END IF;

    -- 19. Hemelhuijs
    SELECT id INTO v_place_id FROM places WHERE name = 'Hemelhuijs';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '09:00:00', '15:00:00'),
                (v_place_id, 2, '09:00:00', '15:00:00'),
                (v_place_id, 3, '09:00:00', '15:00:00'),
                (v_place_id, 4, '09:00:00', '15:00:00'),
                (v_place_id, 5, '09:00:00', '15:00:00'),
                (v_place_id, 6, '09:00:00', '14:00:00');
        END IF;
    END IF;

    -- 20. Home of the Bean
    SELECT id INTO v_place_id FROM places WHERE name = 'Home of the Bean';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '07:00:00', '17:00:00'),
                (v_place_id, 2, '07:00:00', '17:00:00'),
                (v_place_id, 3, '07:00:00', '17:00:00'),
                (v_place_id, 4, '07:00:00', '17:00:00'),
                (v_place_id, 5, '07:00:00', '17:00:00'),
                (v_place_id, 6, '07:30:00', '17:00:00'),
                (v_place_id, 7, '08:00:00', '16:00:00');
        END IF;
    END IF;

    -- 21. House of Machines
    SELECT id INTO v_place_id FROM places WHERE name = 'House of Machines';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '07:00:00', '02:00:00'),
                (v_place_id, 2, '07:00:00', '02:00:00'),
                (v_place_id, 3, '07:00:00', '02:00:00'),
                (v_place_id, 4, '07:00:00', '02:00:00'),
                (v_place_id, 5, '07:00:00', '02:00:00'),
                (v_place_id, 6, '09:00:00', '02:00:00'),
                (v_place_id, 7, '09:00:00', '16:00:00');
        END IF;
    END IF;

    -- 22. Kitcheners
    SELECT id INTO v_place_id FROM places WHERE name = 'Kitcheners';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '12:00:00', '04:00:00'),
                (v_place_id, 2, '12:00:00', '04:00:00'),
                (v_place_id, 3, '12:00:00', '04:00:00'),
                (v_place_id, 4, '12:00:00', '04:00:00'),
                (v_place_id, 5, '12:00:00', '04:00:00'),
                (v_place_id, 6, '12:00:00', '04:00:00'),
                (v_place_id, 7, '12:00:00', '04:00:00');
        END IF;
    END IF;

    -- 23. Kitcheners Carvery Bar
    SELECT id INTO v_place_id FROM places WHERE name = 'Kitcheners Carvery Bar';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '12:00:00', '04:00:00'),
                (v_place_id, 2, '12:00:00', '04:00:00'),
                (v_place_id, 3, '12:00:00', '04:00:00'),
                (v_place_id, 4, '12:00:00', '04:00:00'),
                (v_place_id, 5, '12:00:00', '04:00:00'),
                (v_place_id, 6, '12:00:00', '04:00:00'),
                (v_place_id, 7, '12:00:00', '04:00:00');
        END IF;
    END IF;

    -- 24. Kream
    SELECT id INTO v_place_id FROM places WHERE name = 'Kream';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '11:00:00', '02:00:00'),
                (v_place_id, 2, '11:00:00', '02:00:00'),
                (v_place_id, 3, '11:00:00', '02:00:00'),
                (v_place_id, 4, '11:00:00', '02:00:00'),
                (v_place_id, 5, '11:00:00', '02:00:00'),
                (v_place_id, 6, '11:00:00', '02:00:00'),
                (v_place_id, 7, '11:00:00', '01:00:00');
        END IF;
    END IF;

    -- 25. Maboneng Roof Top Market
    SELECT id INTO v_place_id FROM places WHERE name = 'Maboneng Roof Top Market';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 7, '10:00:00', '15:00:00');
        END IF;
    END IF;

    -- 26. Aandklas
    SELECT id INTO v_place_id FROM places WHERE name = 'Aandklas';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '11:00:00', '02:00:00'),
                (v_place_id, 2, '11:00:00', '02:00:00'),
                (v_place_id, 3, '11:00:00', '02:00:00'),
                (v_place_id, 4, '11:00:00', '02:00:00'),
                (v_place_id, 5, '11:00:00', '02:00:00'),
                (v_place_id, 6, '11:00:00', '02:00:00'),
                (v_place_id, 7, '11:00:00', '02:00:00');
        END IF;
    END IF;

    -- 27. Afro's Chicken Shop
    SELECT id INTO v_place_id FROM places WHERE name = 'Afro''s Chicken Shop';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '08:00:00', '18:00:00'),
                (v_place_id, 2, '08:00:00', '18:00:00'),
                (v_place_id, 3, '08:00:00', '18:00:00'),
                (v_place_id, 4, '08:00:00', '18:00:00'),
                (v_place_id, 5, '08:00:00', '18:00:00'),
                (v_place_id, 6, '08:00:00', '18:00:00'),
                (v_place_id, 7, '08:00:00', '18:00:00');
        END IF;
    END IF;

    -- 28. Alfie’s Pizzeria
    SELECT id INTO v_place_id FROM places WHERE name = 'Alfie’s Pizzeria';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 2, '11:00:00', '22:00:00'),
                (v_place_id, 3, '11:00:00', '22:00:00'),
                (v_place_id, 4, '11:00:00', '22:00:00'),
                (v_place_id, 5, '11:00:00', '22:00:00'),
                (v_place_id, 6, '11:00:00', '22:00:00'),
                (v_place_id, 7, '11:00:00', '15:00:00');
        END IF;
    END IF;

    -- 29. AND Club
    SELECT id INTO v_place_id FROM places WHERE name = 'AND Club';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 4, '21:00:00', '04:00:00'),
                (v_place_id, 5, '21:00:00', '04:00:00'),
                (v_place_id, 6, '21:00:00', '04:00:00');
        END IF;
    END IF;

    -- 30. Arcade
    SELECT id INTO v_place_id FROM places WHERE name = 'Arcade';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 2, '18:00:00', '02:00:00'),
                (v_place_id, 3, '18:00:00', '02:00:00'),
                (v_place_id, 4, '18:00:00', '02:00:00'),
                (v_place_id, 5, '18:00:00', '02:00:00'),
                (v_place_id, 6, '18:00:00', '02:00:00');
        END IF;
    END IF;

    -- 31. Artisan Cafe
    SELECT id INTO v_place_id FROM places WHERE name = 'Artisan Cafe';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '07:00:00', '17:00:00'),
                (v_place_id, 2, '07:00:00', '17:00:00'),
                (v_place_id, 3, '07:00:00', '17:00:00'),
                (v_place_id, 4, '07:00:00', '17:00:00'),
                (v_place_id, 5, '07:00:00', '17:00:00'),
                (v_place_id, 6, '08:00:00', '14:00:00');
        END IF;
    END IF;

    -- 32. Artists' Proof Brewing
    SELECT id INTO v_place_id FROM places WHERE name = 'Artists'' Proof Brewing';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 4, '16:00:00', '22:00:00'),
                (v_place_id, 5, '16:00:00', '22:00:00'),
                (v_place_id, 6, '12:00:00', '22:00:00'),
                (v_place_id, 7, '12:00:00', '18:00:00');
        END IF;
    END IF;

    -- 33. Arts on Main
    SELECT id INTO v_place_id FROM places WHERE name = 'Arts on Main';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 2, '09:00:00', '17:00:00'),
                (v_place_id, 3, '09:00:00', '17:00:00'),
                (v_place_id, 4, '09:00:00', '17:00:00'),
                (v_place_id, 5, '09:00:00', '17:00:00'),
                (v_place_id, 6, '09:00:00', '17:00:00'),
                (v_place_id, 7, '09:00:00', '17:00:00');
        END IF;
    END IF;

    -- 34. Asoka
    SELECT id INTO v_place_id FROM places WHERE name = 'Asoka';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '18:00:00', '02:00:00'),
                (v_place_id, 2, '18:00:00', '02:00:00'),
                (v_place_id, 3, '18:00:00', '02:00:00'),
                (v_place_id, 4, '18:00:00', '02:00:00'),
                (v_place_id, 5, '18:00:00', '02:00:00'),
                (v_place_id, 6, '18:00:00', '02:00:00'),
                (v_place_id, 7, '18:00:00', '02:00:00');
        END IF;
    END IF;

    -- 35. Babylon
    SELECT id INTO v_place_id FROM places WHERE name = 'Babylon';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 5, '20:00:00', '06:00:00'),
                (v_place_id, 6, '20:00:00', '06:00:00');
        END IF;
    END IF;

    -- 36. Bannister Hotel Beer Garden
    SELECT id INTO v_place_id FROM places WHERE name = 'Bannister Hotel Beer Garden';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '07:30:00', '21:00:00'),
                (v_place_id, 2, '07:30:00', '21:00:00'),
                (v_place_id, 3, '07:30:00', '21:00:00'),
                (v_place_id, 4, '07:30:00', '22:00:00'),
                (v_place_id, 5, '07:30:00', '02:00:00'),
                (v_place_id, 6, '07:30:00', '02:00:00'),
                (v_place_id, 7, '07:30:00', '21:00:00');
        END IF;
    END IF;

    -- 37. Bean There Coffee Company
    SELECT id INTO v_place_id FROM places WHERE name = 'Bean There Coffee Company';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '07:30:00', '16:00:00'),
                (v_place_id, 2, '07:30:00', '16:00:00'),
                (v_place_id, 3, '07:30:00', '16:00:00'),
                (v_place_id, 4, '07:30:00', '16:00:00'),
                (v_place_id, 5, '07:30:00', '16:00:00'),
                (v_place_id, 6, '08:00:00', '15:00:00'),
                (v_place_id, 7, '08:00:00', '14:00:00');
        END IF;
    END IF;

    -- 38. Blondie
    SELECT id INTO v_place_id FROM places WHERE name = 'Blondie';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 2, '12:00:00', '00:00:00'),
                (v_place_id, 3, '12:00:00', '00:00:00'),
                (v_place_id, 4, '12:00:00', '00:00:00'),
                (v_place_id, 5, '12:00:00', '00:00:00'),
                (v_place_id, 6, '12:00:00', '00:00:00'),
                (v_place_id, 7, '12:00:00', '22:00:00');
        END IF;
    END IF;

    -- 39. Blondie Bar (Cape Town)
    SELECT id INTO v_place_id FROM places WHERE name = 'Blondie Bar (Cape Town)';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 2, '12:00:00', '00:00:00'),
                (v_place_id, 3, '12:00:00', '00:00:00'),
                (v_place_id, 4, '12:00:00', '00:00:00'),
                (v_place_id, 5, '12:00:00', '00:00:00'),
                (v_place_id, 6, '12:00:00', '00:00:00'),
                (v_place_id, 7, '12:00:00', '22:00:00');
        END IF;
    END IF;

    -- 40. Blue Crane
    SELECT id INTO v_place_id FROM places WHERE name = 'Blue Crane';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '08:00:00', '15:00:00'),
                (v_place_id, 2, '08:00:00', '15:00:00'),
                (v_place_id, 3, '08:00:00', '15:00:00'),
                (v_place_id, 4, '08:00:00', '22:00:00'),
                (v_place_id, 5, '08:00:00', '22:00:00'),
                (v_place_id, 6, '08:00:00', '22:00:00'),
                (v_place_id, 7, '08:00:00', '15:00:00');
        END IF;
    END IF;

    -- 41. Buitenverwachting Wine Estate Tasting Room
    SELECT id INTO v_place_id FROM places WHERE name = 'Buitenverwachting Wine Estate Tasting Room';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '10:00:00', '16:00:00'),
                (v_place_id, 2, '10:00:00', '16:00:00'),
                (v_place_id, 3, '10:00:00', '16:00:00'),
                (v_place_id, 4, '10:00:00', '16:00:00'),
                (v_place_id, 5, '10:00:00', '16:00:00'),
                (v_place_id, 6, '10:00:00', '16:00:00');
        END IF;
    END IF;

    -- 42. Butcher Boys
    SELECT id INTO v_place_id FROM places WHERE name = 'Butcher Boys';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '11:30:00', '22:00:00'),
                (v_place_id, 2, '11:30:00', '22:00:00'),
                (v_place_id, 3, '11:30:00', '22:00:00'),
                (v_place_id, 4, '11:30:00', '22:00:00'),
                (v_place_id, 5, '11:30:00', '22:00:00'),
                (v_place_id, 6, '11:30:00', '22:00:00'),
                (v_place_id, 7, '11:30:00', '22:00:00');
        END IF;
    END IF;

    -- 43. Café Caprice
    SELECT id INTO v_place_id FROM places WHERE name = 'Café Caprice';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '12:00:00', '00:00:00'),
                (v_place_id, 2, '09:00:00', '00:00:00'),
                (v_place_id, 3, '09:00:00', '00:00:00'),
                (v_place_id, 4, '09:00:00', '00:00:00'),
                (v_place_id, 5, '09:00:00', '01:00:00'),
                (v_place_id, 6, '09:00:00', '01:00:00'),
                (v_place_id, 7, '09:00:00', '01:00:00');
        END IF;
    END IF;

    -- 44. Cafe Riche
    SELECT id INTO v_place_id FROM places WHERE name = 'Cafe Riche';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '06:00:00', '18:00:00'),
                (v_place_id, 2, '06:00:00', '18:00:00'),
                (v_place_id, 3, '06:00:00', '18:00:00'),
                (v_place_id, 4, '06:00:00', '18:00:00'),
                (v_place_id, 5, '06:00:00', '18:00:00'),
                (v_place_id, 6, '06:00:00', '18:00:00'),
                (v_place_id, 7, '06:00:00', '18:00:00');
        END IF;
    END IF;

    -- 45. Cape Point Vineyards
    SELECT id INTO v_place_id FROM places WHERE name = 'Cape Point Vineyards';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '11:00:00', '18:00:00'),
                (v_place_id, 2, '11:00:00', '18:00:00'),
                (v_place_id, 3, '11:00:00', '18:00:00'),
                (v_place_id, 4, '11:00:00', '20:30:00'),
                (v_place_id, 5, '11:00:00', '20:30:00'),
                (v_place_id, 6, '11:00:00', '20:30:00'),
                (v_place_id, 7, '11:00:00', '18:00:00');
        END IF;
    END IF;

    -- 46. Capital Craft
    SELECT id INTO v_place_id FROM places WHERE name = 'Capital Craft';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '10:30:00', '23:00:00'),
                (v_place_id, 2, '10:30:00', '23:00:00'),
                (v_place_id, 3, '10:30:00', '23:00:00'),
                (v_place_id, 4, '10:30:00', '23:00:00'),
                (v_place_id, 5, '10:30:00', '23:00:00'),
                (v_place_id, 6, '10:30:00', '23:00:00'),
                (v_place_id, 7, '10:30:00', '19:30:00');
        END IF;
    END IF;

    -- 47. Chardonnay Deli
    SELECT id INTO v_place_id FROM places WHERE name = 'Chardonnay Deli';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '07:00:00', '18:00:00'),
                (v_place_id, 2, '07:00:00', '18:00:00'),
                (v_place_id, 3, '07:00:00', '18:00:00'),
                (v_place_id, 4, '07:00:00', '18:00:00'),
                (v_place_id, 5, '07:00:00', '18:00:00'),
                (v_place_id, 6, '07:00:00', '18:00:00'),
                (v_place_id, 7, '07:00:00', '18:00:00');
        END IF;
    END IF;

    -- 48. Chef's Warehouse & Canteen
    SELECT id INTO v_place_id FROM places WHERE name = 'Chef''s Warehouse & Canteen';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '12:00:00', '21:30:00'),
                (v_place_id, 2, '12:00:00', '21:30:00'),
                (v_place_id, 3, '12:00:00', '21:30:00'),
                (v_place_id, 4, '12:00:00', '21:30:00'),
                (v_place_id, 5, '12:00:00', '21:30:00'),
                (v_place_id, 6, '12:00:00', '21:30:00');
        END IF;
    END IF;

    -- 49. Chinchilla
    SELECT id INTO v_place_id FROM places WHERE name = 'Chinchilla';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '12:00:00', '22:00:00'),
                (v_place_id, 2, '12:00:00', '22:00:00'),
                (v_place_id, 3, '12:00:00', '22:00:00'),
                (v_place_id, 4, '12:00:00', '22:00:00'),
                (v_place_id, 5, '12:00:00', '22:00:00'),
                (v_place_id, 6, '12:00:00', '22:00:00'),
                (v_place_id, 7, '12:00:00', '22:00:00');
        END IF;
    END IF;

    -- 50. Clarke's Dining Room
    SELECT id INTO v_place_id FROM places WHERE name = 'Clarke''s Dining Room';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '07:00:00', '16:00:00'),
                (v_place_id, 2, '07:00:00', '22:00:00'),
                (v_place_id, 3, '07:00:00', '22:00:00'),
                (v_place_id, 4, '07:00:00', '22:00:00'),
                (v_place_id, 5, '07:00:00', '22:00:00'),
                (v_place_id, 6, '08:00:00', '22:00:00'),
                (v_place_id, 7, '08:00:00', '15:00:00');
        END IF;
    END IF;

    -- 51. Constitution Hill
    SELECT id INTO v_place_id FROM places WHERE name = 'Constitution Hill';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '09:00:00', '17:00:00'),
                (v_place_id, 2, '09:00:00', '17:00:00'),
                (v_place_id, 3, '09:00:00', '17:00:00'),
                (v_place_id, 4, '09:00:00', '17:00:00'),
                (v_place_id, 5, '09:00:00', '17:00:00'),
                (v_place_id, 6, '09:00:00', '17:00:00'),
                (v_place_id, 7, '09:00:00', '17:00:00');
        END IF;
    END IF;

    -- 52. Cramers Coffee
    SELECT id INTO v_place_id FROM places WHERE name = 'Cramers Coffee';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '06:00:00', '18:30:00'),
                (v_place_id, 2, '06:00:00', '18:30:00'),
                (v_place_id, 3, '06:00:00', '18:30:00'),
                (v_place_id, 4, '06:00:00', '18:30:00'),
                (v_place_id, 5, '06:00:00', '18:30:00'),
                (v_place_id, 6, '07:00:00', '17:00:00');
        END IF;
    END IF;

    -- 53. Crawford's Brasserie
    SELECT id INTO v_place_id FROM places WHERE name = 'Crawford''s Brasserie';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '06:30:00', '22:30:00'),
                (v_place_id, 2, '06:30:00', '22:30:00'),
                (v_place_id, 3, '06:30:00', '22:30:00'),
                (v_place_id, 4, '06:30:00', '22:30:00'),
                (v_place_id, 5, '06:30:00', '22:30:00'),
                (v_place_id, 6, '06:30:00', '22:30:00'),
                (v_place_id, 7, '06:30:00', '22:30:00');
        END IF;
    END IF;

    -- 54. Culture Club - Bar de Tapas
    SELECT id INTO v_place_id FROM places WHERE name = 'Culture Club - Bar de Tapas';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 2, '12:00:00', '23:00:00'),
                (v_place_id, 3, '12:00:00', '23:00:00'),
                (v_place_id, 4, '12:00:00', '23:00:00'),
                (v_place_id, 5, '12:00:00', '23:00:00'),
                (v_place_id, 6, '12:00:00', '23:00:00');
        END IF;
    END IF;

    -- 55. Devil's Peak Taproom
    SELECT id INTO v_place_id FROM places WHERE name = 'Devil''s Peak Taproom';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '11:00:00', '23:00:00'),
                (v_place_id, 2, '11:00:00', '23:00:00'),
                (v_place_id, 3, '11:00:00', '23:00:00'),
                (v_place_id, 4, '11:00:00', '23:00:00'),
                (v_place_id, 5, '11:00:00', '23:00:00'),
                (v_place_id, 6, '11:00:00', '23:00:00');
        END IF;
    END IF;

    -- 56. Die Akker
    SELECT id INTO v_place_id FROM places WHERE name = 'Die Akker';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '10:00:00', '02:00:00'),
                (v_place_id, 2, '10:00:00', '02:00:00'),
                (v_place_id, 3, '10:00:00', '02:00:00'),
                (v_place_id, 4, '10:00:00', '02:00:00'),
                (v_place_id, 5, '10:00:00', '02:00:00'),
                (v_place_id, 6, '10:00:00', '02:00:00'),
                (v_place_id, 7, '10:00:00', '02:00:00');
        END IF;
    END IF;

    -- 57. Dros
    SELECT id INTO v_place_id FROM places WHERE name = 'Dros';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '08:00:00', '22:00:00'),
                (v_place_id, 2, '08:00:00', '22:00:00'),
                (v_place_id, 3, '08:00:00', '22:00:00'),
                (v_place_id, 4, '08:00:00', '22:00:00'),
                (v_place_id, 5, '08:00:00', '22:00:00'),
                (v_place_id, 6, '08:00:00', '22:00:00'),
                (v_place_id, 7, '08:00:00', '22:00:00');
        END IF;
    END IF;

    -- 58. Dukkah Restaurant and Bar
    SELECT id INTO v_place_id FROM places WHERE name = 'Dukkah Restaurant and Bar';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '11:00:00', '02:00:00'),
                (v_place_id, 2, '11:00:00', '02:00:00'),
                (v_place_id, 3, '11:00:00', '02:00:00'),
                (v_place_id, 4, '11:00:00', '02:00:00'),
                (v_place_id, 5, '11:00:00', '02:00:00'),
                (v_place_id, 6, '08:00:00', '02:00:00'),
                (v_place_id, 7, '08:00:00', '02:00:00');
        END IF;
    END IF;

    -- 59. Durban City Hall
    SELECT id INTO v_place_id FROM places WHERE name = 'Durban City Hall';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '08:00:00', '17:00:00'),
                (v_place_id, 2, '08:00:00', '17:00:00'),
                (v_place_id, 3, '08:00:00', '17:00:00'),
                (v_place_id, 4, '08:00:00', '17:00:00'),
                (v_place_id, 5, '08:00:00', '17:00:00');
        END IF;
    END IF;

    -- 60. Durban International Convention Centre
    SELECT id INTO v_place_id FROM places WHERE name = 'Durban International Convention Centre';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '08:00:00', '17:00:00'),
                (v_place_id, 2, '08:00:00', '17:00:00'),
                (v_place_id, 3, '08:00:00', '17:00:00'),
                (v_place_id, 4, '08:00:00', '17:00:00'),
                (v_place_id, 5, '08:00:00', '17:00:00');
        END IF;
    END IF;

    -- 61. Durban Natural Science Museum
    SELECT id INTO v_place_id FROM places WHERE name = 'Durban Natural Science Museum';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '08:30:00', '16:00:00'),
                (v_place_id, 2, '08:30:00', '16:00:00'),
                (v_place_id, 3, '08:30:00', '16:00:00'),
                (v_place_id, 4, '08:30:00', '16:00:00'),
                (v_place_id, 5, '08:30:00', '16:00:00'),
                (v_place_id, 6, '08:30:00', '16:00:00');
        END IF;
    END IF;

    -- 62. ëlgr
    SELECT id INTO v_place_id FROM places WHERE name = 'ëlgr';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 2, '18:00:00', '23:00:00'),
                (v_place_id, 3, '18:00:00', '23:00:00'),
                (v_place_id, 4, '18:00:00', '23:00:00'),
                (v_place_id, 5, '18:00:00', '23:00:00'),
                (v_place_id, 6, '12:00:00', '23:00:00');
        END IF;
    END IF;

    -- 63. Father Coffee
    SELECT id INTO v_place_id FROM places WHERE name = 'Father Coffee';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '07:30:00', '16:30:00'),
                (v_place_id, 2, '07:30:00', '16:30:00'),
                (v_place_id, 3, '07:30:00', '16:30:00'),
                (v_place_id, 4, '07:30:00', '16:30:00'),
                (v_place_id, 5, '07:30:00', '16:30:00'),
                (v_place_id, 6, '08:00:00', '16:30:00'),
                (v_place_id, 7, '08:00:00', '16:30:00');
        END IF;
    END IF;

    -- 64. Forti Grill & Bar
    SELECT id INTO v_place_id FROM places WHERE name = 'Forti Grill & Bar';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '11:00:00', '22:00:00'),
                (v_place_id, 2, '11:00:00', '22:00:00'),
                (v_place_id, 3, '11:00:00', '22:00:00'),
                (v_place_id, 4, '11:00:00', '22:00:00'),
                (v_place_id, 5, '11:00:00', '22:00:00'),
                (v_place_id, 6, '11:00:00', '22:00:00'),
                (v_place_id, 7, '11:00:00', '22:00:00');
        END IF;
    END IF;

    -- 65. Freedom Cafe
    SELECT id INTO v_place_id FROM places WHERE name = 'Freedom Cafe';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '07:00:00', '20:00:00'),
                (v_place_id, 2, '07:00:00', '20:00:00'),
                (v_place_id, 3, '07:00:00', '20:00:00'),
                (v_place_id, 4, '07:00:00', '20:00:00'),
                (v_place_id, 5, '07:00:00', '20:00:00'),
                (v_place_id, 6, '07:00:00', '20:00:00'),
                (v_place_id, 7, '07:00:00', '20:00:00');
        END IF;
    END IF;

    -- 66. Groot Constantia Wine Estate
    SELECT id INTO v_place_id FROM places WHERE name = 'Groot Constantia Wine Estate';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '09:00:00', '17:00:00'),
                (v_place_id, 2, '09:00:00', '17:00:00'),
                (v_place_id, 3, '09:00:00', '17:00:00'),
                (v_place_id, 4, '09:00:00', '17:00:00'),
                (v_place_id, 5, '09:00:00', '17:00:00'),
                (v_place_id, 6, '09:00:00', '17:00:00'),
                (v_place_id, 7, '09:00:00', '17:00:00');
        END IF;
    END IF;

    -- 67. Ile Maurice
    SELECT id INTO v_place_id FROM places WHERE name = 'Ile Maurice';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '09:00:00', '16:00:00'),
                (v_place_id, 2, '12:00:00', '21:30:00'),
                (v_place_id, 3, '12:00:00', '21:30:00'),
                (v_place_id, 4, '12:00:00', '21:30:00'),
                (v_place_id, 5, '12:00:00', '21:30:00'),
                (v_place_id, 6, '12:00:00', '21:30:00'),
                (v_place_id, 7, '12:00:00', '21:30:00');
        END IF;
    END IF;

    -- 68. Jack Salmon Fish House
    SELECT id INTO v_place_id FROM places WHERE name = 'Jack Salmon Fish House';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '12:00:00', '21:30:00'),
                (v_place_id, 2, '12:00:00', '21:30:00'),
                (v_place_id, 3, '12:00:00', '21:30:00'),
                (v_place_id, 4, '12:00:00', '21:30:00'),
                (v_place_id, 5, '12:00:00', '21:30:00'),
                (v_place_id, 6, '12:00:00', '21:30:00'),
                (v_place_id, 7, '12:00:00', '21:30:00');
        END IF;
    END IF;

    -- 69. James & Ethel Gray Park
    SELECT id INTO v_place_id FROM places WHERE name = 'James & Ethel Gray Park';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '06:00:00', '18:00:00'),
                (v_place_id, 2, '06:00:00', '18:00:00'),
                (v_place_id, 3, '06:00:00', '18:00:00'),
                (v_place_id, 4, '06:00:00', '18:00:00'),
                (v_place_id, 5, '06:00:00', '18:00:00'),
                (v_place_id, 6, '06:00:00', '18:00:00'),
                (v_place_id, 7, '06:00:00', '18:00:00');
        END IF;
    END IF;

    -- 70. Jason Bakery
    SELECT id INTO v_place_id FROM places WHERE name = 'Jason Bakery';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 2, '07:00:00', '15:00:00'),
                (v_place_id, 3, '07:00:00', '15:00:00'),
                (v_place_id, 4, '07:00:00', '15:00:00'),
                (v_place_id, 5, '07:00:00', '15:00:00'),
                (v_place_id, 6, '07:00:00', '14:00:00'),
                (v_place_id, 7, '08:00:00', '14:00:00');
        END IF;
    END IF;

    -- 71. Katzy's
    SELECT id INTO v_place_id FROM places WHERE name = 'Katzy''s';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '12:00:00', '22:00:00'),
                (v_place_id, 2, '12:00:00', '22:00:00'),
                (v_place_id, 3, '12:00:00', '22:00:00'),
                (v_place_id, 4, '12:00:00', '22:00:00'),
                (v_place_id, 5, '12:00:00', '22:00:00'),
                (v_place_id, 6, '12:00:00', '22:00:00'),
                (v_place_id, 7, '12:00:00', '22:00:00');
        END IF;
    END IF;

    -- 72. Kauai
    SELECT id INTO v_place_id FROM places WHERE name = 'Kauai';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '09:00:00', '21:00:00'),
                (v_place_id, 2, '09:00:00', '21:00:00'),
                (v_place_id, 3, '09:00:00', '21:00:00'),
                (v_place_id, 4, '09:00:00', '21:00:00'),
                (v_place_id, 5, '09:00:00', '21:00:00'),
                (v_place_id, 6, '09:00:00', '21:00:00'),
                (v_place_id, 7, '09:00:00', '21:00:00');
        END IF;
    END IF;

    -- 73. Keyes Art Mile
    SELECT id INTO v_place_id FROM places WHERE name = 'Keyes Art Mile';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '09:00:00', '14:00:00'),
                (v_place_id, 2, '09:00:00', '14:00:00'),
                (v_place_id, 3, '09:00:00', '14:00:00'),
                (v_place_id, 4, '09:00:00', '14:00:00'),
                (v_place_id, 5, '09:00:00', '14:00:00'),
                (v_place_id, 6, '09:00:00', '14:00:00');
        END IF;
    END IF;

    -- 74. Kirstenbosch National Botanical Garden
    SELECT id INTO v_place_id FROM places WHERE name = 'Kirstenbosch National Botanical Garden';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '08:00:00', '19:00:00'),
                (v_place_id, 2, '08:00:00', '19:00:00'),
                (v_place_id, 3, '08:00:00', '19:00:00'),
                (v_place_id, 4, '08:00:00', '19:00:00'),
                (v_place_id, 5, '08:00:00', '19:00:00'),
                (v_place_id, 6, '08:00:00', '19:00:00'),
                (v_place_id, 7, '08:00:00', '19:00:00');
        END IF;
    END IF;

    -- 75. Klipriviersberg Nature Reserve
    SELECT id INTO v_place_id FROM places WHERE name = 'Klipriviersberg Nature Reserve';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '06:00:00', '18:00:00'),
                (v_place_id, 2, '06:00:00', '18:00:00'),
                (v_place_id, 3, '06:00:00', '18:00:00'),
                (v_place_id, 4, '06:00:00', '18:00:00'),
                (v_place_id, 5, '06:00:00', '18:00:00'),
                (v_place_id, 6, '06:00:00', '18:00:00'),
                (v_place_id, 7, '06:00:00', '18:00:00');
        END IF;
    END IF;

    -- 76. Kloof Street House
    SELECT id INTO v_place_id FROM places WHERE name = 'Kloof Street House';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '11:00:00', '00:00:00'),
                (v_place_id, 2, '10:00:00', '00:00:00'),
                (v_place_id, 3, '10:00:00', '00:00:00'),
                (v_place_id, 4, '10:00:00', '00:00:00'),
                (v_place_id, 5, '10:00:00', '00:00:00'),
                (v_place_id, 6, '10:00:00', '00:00:00'),
                (v_place_id, 7, '10:00:00', '00:00:00');
        END IF;
    END IF;

    -- 77. Koffee Culture
    SELECT id INTO v_place_id FROM places WHERE name = 'Koffee Culture';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '07:00:00', '16:00:00'),
                (v_place_id, 2, '07:00:00', '16:00:00'),
                (v_place_id, 3, '07:00:00', '16:00:00'),
                (v_place_id, 4, '07:00:00', '16:00:00'),
                (v_place_id, 5, '07:00:00', '16:00:00'),
                (v_place_id, 6, '07:00:00', '13:00:00'),
                (v_place_id, 7, '08:00:00', '13:00:00');
        END IF;
    END IF;

    -- 78. Kruger House Museum
    SELECT id INTO v_place_id FROM places WHERE name = 'Kruger House Museum';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '08:30:00', '16:00:00'),
                (v_place_id, 2, '08:30:00', '16:00:00'),
                (v_place_id, 3, '08:30:00', '16:00:00'),
                (v_place_id, 4, '08:30:00', '16:00:00'),
                (v_place_id, 5, '08:30:00', '16:00:00'),
                (v_place_id, 6, '09:00:00', '16:00:00'),
                (v_place_id, 7, '11:00:00', '16:00:00');
        END IF;
    END IF;

    -- 79. KwaMuhle Museum
    SELECT id INTO v_place_id FROM places WHERE name = 'KwaMuhle Museum';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '08:30:00', '16:00:00'),
                (v_place_id, 2, '08:30:00', '16:00:00'),
                (v_place_id, 3, '08:30:00', '16:00:00'),
                (v_place_id, 4, '08:30:00', '16:00:00'),
                (v_place_id, 5, '08:30:00', '16:00:00'),
                (v_place_id, 6, '08:30:00', '12:30:00');
        END IF;
    END IF;

    -- 80. La Parada
    SELECT id INTO v_place_id FROM places WHERE name = 'La Parada';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '11:00:00', '00:00:00'),
                (v_place_id, 2, '11:00:00', '00:00:00'),
                (v_place_id, 3, '11:00:00', '00:00:00'),
                (v_place_id, 4, '11:00:00', '00:00:00'),
                (v_place_id, 5, '11:00:00', '00:00:00'),
                (v_place_id, 6, '11:00:00', '00:00:00'),
                (v_place_id, 7, '11:00:00', '00:00:00');
        END IF;
    END IF;

    -- 81. Labia Theatre
    SELECT id INTO v_place_id FROM places WHERE name = 'Labia Theatre';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '11:00:00', '22:30:00'),
                (v_place_id, 2, '11:00:00', '22:30:00'),
                (v_place_id, 3, '11:00:00', '22:30:00'),
                (v_place_id, 4, '11:00:00', '22:30:00'),
                (v_place_id, 5, '11:00:00', '22:30:00'),
                (v_place_id, 6, '11:00:00', '22:30:00'),
                (v_place_id, 7, '11:00:00', '22:30:00');
        END IF;
    END IF;

    -- 82. Leo's Wine Bar
    SELECT id INTO v_place_id FROM places WHERE name = 'Leo''s Wine Bar';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '17:00:00', '23:00:00'),
                (v_place_id, 2, '17:00:00', '23:00:00'),
                (v_place_id, 3, '17:00:00', '23:00:00'),
                (v_place_id, 4, '17:00:00', '23:00:00'),
                (v_place_id, 5, '17:00:00', '23:00:00'),
                (v_place_id, 6, '17:00:00', '23:00:00');
        END IF;
    END IF;

    -- 83. Little Gujarat
    SELECT id INTO v_place_id FROM places WHERE name = 'Little Gujarat';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '09:00:00', '17:00:00'),
                (v_place_id, 2, '09:00:00', '17:00:00'),
                (v_place_id, 3, '09:00:00', '17:00:00'),
                (v_place_id, 4, '09:00:00', '17:00:00'),
                (v_place_id, 5, '09:00:00', '17:00:00'),
                (v_place_id, 6, '09:00:00', '15:00:00');
        END IF;
    END IF;

    -- 84. Liv
    SELECT id INTO v_place_id FROM places WHERE name = 'Liv';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 5, '21:00:00', '04:00:00'),
                (v_place_id, 6, '21:00:00', '04:00:00');
        END IF;
    END IF;

    -- 85. Lolita's
    SELECT id INTO v_place_id FROM places WHERE name = 'Lolita''s';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 2, '12:00:00', '22:00:00'),
                (v_place_id, 3, '12:00:00', '22:00:00'),
                (v_place_id, 4, '12:00:00', '22:00:00'),
                (v_place_id, 5, '12:00:00', '23:00:00'),
                (v_place_id, 6, '12:00:00', '23:00:00'),
                (v_place_id, 7, '12:00:00', '20:00:00');
        END IF;
    END IF;

    -- 86. Marble Restaurant
    FOR v_place_id IN SELECT id FROM places WHERE name = 'Marble Restaurant' LOOP
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '12:00:00', '22:00:00'),
                (v_place_id, 2, '12:00:00', '22:00:00'),
                (v_place_id, 3, '12:00:00', '22:00:00'),
                (v_place_id, 4, '12:00:00', '22:00:00'),
                (v_place_id, 5, '12:00:00', '22:00:00'),
                (v_place_id, 6, '12:00:00', '22:00:00'),
                (v_place_id, 7, '12:00:00', '22:00:00');
        END IF;
    END LOOP;

    -- 87. Max's Lifestyle
    SELECT id INTO v_place_id FROM places WHERE name = 'Max''s Lifestyle';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '07:00:00', '22:00:00'),
                (v_place_id, 2, '07:00:00', '22:00:00'),
                (v_place_id, 3, '07:00:00', '22:00:00'),
                (v_place_id, 4, '07:00:00', '22:00:00'),
                (v_place_id, 5, '07:00:00', '02:00:00'),
                (v_place_id, 6, '07:00:00', '02:00:00'),
                (v_place_id, 7, '07:00:00', '02:00:00');
        END IF;
    END IF;

    -- 88. Meraki
    SELECT id INTO v_place_id FROM places WHERE name = 'Meraki';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '07:00:00', '17:30:00'),
                (v_place_id, 2, '07:00:00', '17:30:00'),
                (v_place_id, 3, '07:00:00', '17:30:00'),
                (v_place_id, 4, '07:00:00', '17:30:00'),
                (v_place_id, 5, '07:00:00', '17:30:00'),
                (v_place_id, 6, '08:00:00', '17:00:00');
        END IF;
    END IF;

    -- 89. Mezetaki
    SELECT id INTO v_place_id FROM places WHERE name = 'Mezetaki';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '07:30:00', '17:30:00'),
                (v_place_id, 2, '07:30:00', '17:30:00'),
                (v_place_id, 3, '07:30:00', '17:30:00'),
                (v_place_id, 4, '07:30:00', '17:30:00'),
                (v_place_id, 5, '07:30:00', '17:30:00'),
                (v_place_id, 6, '07:30:00', '17:30:00'),
                (v_place_id, 7, '08:00:00', '16:00:00');
        END IF;
    END IF;

    -- 90. Mojo Market
    SELECT id INTO v_place_id FROM places WHERE name = 'Mojo Market';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '08:00:00', '22:00:00'),
                (v_place_id, 2, '08:00:00', '22:00:00'),
                (v_place_id, 3, '08:00:00', '22:00:00'),
                (v_place_id, 4, '08:00:00', '22:00:00'),
                (v_place_id, 5, '08:00:00', '22:00:00'),
                (v_place_id, 6, '08:00:00', '22:00:00'),
                (v_place_id, 7, '08:00:00', '22:00:00');
        END IF;
    END IF;

    -- 91. Pantry by Marble
    SELECT id INTO v_place_id FROM places WHERE name = 'Pantry by Marble';
    IF v_place_id IS NOT NULL THEN
        UPDATE places SET is_24_7 = true WHERE id = v_place_id;
    END IF;

    -- 92. Pata Pata
    SELECT id INTO v_place_id FROM places WHERE name = 'Pata Pata';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '08:00:00', '23:00:00'),
                (v_place_id, 2, '08:00:00', '23:00:00'),
                (v_place_id, 3, '08:00:00', '23:00:00'),
                (v_place_id, 4, '08:00:00', '23:00:00'),
                (v_place_id, 5, '08:00:00', '23:00:00'),
                (v_place_id, 6, '08:00:00', '23:00:00'),
                (v_place_id, 7, '08:00:00', '23:00:00');
        END IF;
    END IF;

    -- 93. Pot Luck Club
    SELECT id INTO v_place_id FROM places WHERE name = 'Pot Luck Club';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '12:30:00', '14:00:00'),
                (v_place_id, 1, '18:00:00', '20:30:00'),
                (v_place_id, 2, '12:30:00', '14:00:00'),
                (v_place_id, 2, '18:00:00', '20:30:00'),
                (v_place_id, 3, '12:30:00', '14:00:00'),
                (v_place_id, 3, '18:00:00', '20:30:00'),
                (v_place_id, 4, '12:30:00', '14:00:00'),
                (v_place_id, 4, '18:00:00', '20:30:00'),
                (v_place_id, 5, '12:30:00', '14:00:00'),
                (v_place_id, 5, '18:00:00', '20:30:00'),
                (v_place_id, 6, '12:30:00', '14:00:00'),
                (v_place_id, 6, '18:00:00', '20:30:00'),
                (v_place_id, 7, '11:00:00', '12:30:00');
        END IF;
    END IF;

    -- 94. Pretoria Country Club
    SELECT id INTO v_place_id FROM places WHERE name = 'Pretoria Country Club';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '08:00:00', '18:00:00'),
                (v_place_id, 2, '08:00:00', '18:00:00'),
                (v_place_id, 3, '08:00:00', '18:00:00'),
                (v_place_id, 4, '08:00:00', '18:00:00'),
                (v_place_id, 5, '08:00:00', '18:00:00'),
                (v_place_id, 6, '08:00:00', '18:00:00'),
                (v_place_id, 7, '08:00:00', '18:00:00');
        END IF;
    END IF;

    -- 95. Proud Mary
    SELECT id INTO v_place_id FROM places WHERE name = 'Proud Mary';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '06:30:00', '00:00:00'),
                (v_place_id, 2, '06:30:00', '00:00:00'),
                (v_place_id, 3, '06:30:00', '00:00:00'),
                (v_place_id, 4, '06:30:00', '00:00:00'),
                (v_place_id, 5, '06:30:00', '00:00:00'),
                (v_place_id, 6, '06:30:00', '00:00:00'),
                (v_place_id, 7, '06:30:00', '00:00:00');
        END IF;
    END IF;

    -- 96. Rietvlei Nature Reserve
    SELECT id INTO v_place_id FROM places WHERE name = 'Rietvlei Nature Reserve';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '06:00:00', '18:00:00'),
                (v_place_id, 2, '06:00:00', '18:00:00'),
                (v_place_id, 3, '06:00:00', '18:00:00'),
                (v_place_id, 4, '06:00:00', '18:00:00'),
                (v_place_id, 5, '06:00:00', '18:00:00'),
                (v_place_id, 6, '06:00:00', '18:00:00'),
                (v_place_id, 7, '06:00:00', '18:00:00');
        END IF;
    END IF;

    -- 97. Shongweni Farmers & Craft Market
    SELECT id INTO v_place_id FROM places WHERE name = 'Shongweni Farmers & Craft Market';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 6, '07:00:00', '13:00:00');
        END IF;
    END IF;

    -- 98. Suncoast Casino and Entertainment
    SELECT id INTO v_place_id FROM places WHERE name = 'Suncoast Casino and Entertainment';
    IF v_place_id IS NOT NULL THEN
        UPDATE places SET is_24_7 = true WHERE id = v_place_id;
    END IF;

    -- 99. Soweto Towers
    SELECT id INTO v_place_id FROM places WHERE name = 'Soweto Towers';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '09:00:00', '17:00:00'),
                (v_place_id, 2, '09:00:00', '17:00:00'),
                (v_place_id, 3, '09:00:00', '17:00:00'),
                (v_place_id, 4, '09:00:00', '17:00:00'),
                (v_place_id, 5, '09:00:00', '17:00:00'),
                (v_place_id, 6, '09:00:00', '17:00:00'),
                (v_place_id, 7, '09:00:00', '17:00:00');
        END IF;
    END IF;

    -- 100. Table Mountain Aerial Cableway
    SELECT id INTO v_place_id FROM places WHERE name = 'Table Mountain Aerial Cableway';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '08:30:00', '19:00:00'),
                (v_place_id, 2, '08:30:00', '19:00:00'),
                (v_place_id, 3, '08:30:00', '19:00:00'),
                (v_place_id, 4, '08:30:00', '19:00:00'),
                (v_place_id, 5, '08:30:00', '19:00:00'),
                (v_place_id, 6, '08:30:00', '19:00:00'),
                (v_place_id, 7, '08:30:00', '19:00:00');
        END IF;
    END IF;

    -- 101. Taco Zulu
    SELECT id INTO v_place_id FROM places WHERE name = 'Taco Zulu';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '11:00:00', '22:00:00'),
                (v_place_id, 2, '11:00:00', '22:00:00'),
                (v_place_id, 3, '11:00:00', '22:00:00'),
                (v_place_id, 4, '11:00:00', '22:00:00'),
                (v_place_id, 5, '11:00:00', '22:00:00'),
                (v_place_id, 6, '11:00:00', '22:00:00'),
                (v_place_id, 7, '11:00:00', '22:00:00');
        END IF;
    END IF;

    -- 102. Sugar Rush Park
    SELECT id INTO v_place_id FROM places WHERE name = 'Sugar Rush Park';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '08:00:00', '16:00:00'),
                (v_place_id, 2, '08:00:00', '16:00:00'),
                (v_place_id, 3, '08:00:00', '16:00:00'),
                (v_place_id, 4, '08:00:00', '16:00:00'),
                (v_place_id, 5, '08:00:00', '16:00:00'),
                (v_place_id, 6, '08:00:00', '16:00:00'),
                (v_place_id, 7, '08:00:00', '16:00:00');
        END IF;
    END IF;

    -- 103. Sprigs
    SELECT id INTO v_place_id FROM places WHERE name = 'Sprigs';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '08:00:00', '17:00:00'),
                (v_place_id, 2, '08:00:00', '17:00:00'),
                (v_place_id, 3, '08:00:00', '17:00:00'),
                (v_place_id, 4, '08:00:00', '17:00:00'),
                (v_place_id, 5, '08:00:00', '17:00:00'),
                (v_place_id, 6, '08:00:00', '14:00:00');
        END IF;
    END IF;

    -- 104. Spoon Eatery and Pizzeria
    SELECT id INTO v_place_id FROM places WHERE name = 'Spoon Eatery and Pizzeria';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '11:00:00', '21:00:00'),
                (v_place_id, 2, '11:00:00', '21:00:00'),
                (v_place_id, 3, '11:00:00', '21:00:00'),
                (v_place_id, 4, '11:00:00', '21:00:00'),
                (v_place_id, 5, '11:00:00', '21:00:00'),
                (v_place_id, 6, '11:00:00', '21:00:00');
        END IF;
    END IF;

    -- 105. Smoke
    SELECT id INTO v_place_id FROM places WHERE name = 'Smoke';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '11:00:00', '22:00:00'),
                (v_place_id, 2, '11:00:00', '22:00:00'),
                (v_place_id, 3, '11:00:00', '22:00:00'),
                (v_place_id, 4, '11:00:00', '22:00:00'),
                (v_place_id, 5, '11:00:00', '22:00:00'),
                (v_place_id, 6, '11:00:00', '22:00:00'),
                (v_place_id, 7, '11:00:00', '22:00:00');
        END IF;
    END IF;

    -- 106. National Zoological Gardens of South Africa
    SELECT id INTO v_place_id FROM places WHERE name = 'National Zoological Gardens of South Africa';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '08:30:00', '17:30:00'),
                (v_place_id, 2, '08:30:00', '17:30:00'),
                (v_place_id, 3, '08:30:00', '17:30:00'),
                (v_place_id, 4, '08:30:00', '17:30:00'),
                (v_place_id, 5, '08:30:00', '17:30:00'),
                (v_place_id, 6, '08:30:00', '17:30:00'),
                (v_place_id, 7, '08:30:00', '17:30:00');
        END IF;
    END IF;

    -- 107. Mushroom Farm Park
    SELECT id INTO v_place_id FROM places WHERE name = 'Mushroom Farm Park';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '06:00:00', '18:00:00'),
                (v_place_id, 2, '06:00:00', '18:00:00'),
                (v_place_id, 3, '06:00:00', '18:00:00'),
                (v_place_id, 4, '06:00:00', '18:00:00'),
                (v_place_id, 5, '06:00:00', '18:00:00'),
                (v_place_id, 6, '06:00:00', '18:00:00'),
                (v_place_id, 7, '06:00:00', '18:00:00');
        END IF;
    END IF;

    -- 108. Museum of Natural History
    SELECT id INTO v_place_id FROM places WHERE name = 'Museum of Natural History';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '09:00:00', '17:00:00'),
                (v_place_id, 2, '09:00:00', '17:00:00'),
                (v_place_id, 3, '09:00:00', '17:00:00'),
                (v_place_id, 4, '09:00:00', '17:00:00'),
                (v_place_id, 5, '09:00:00', '17:00:00'),
                (v_place_id, 6, '09:00:00', '17:00:00'),
                (v_place_id, 7, '09:00:00', '17:00:00');
        END IF;
    END IF;

    -- 109. Moses Mabhida Stadium
    SELECT id INTO v_place_id FROM places WHERE name = 'Moses Mabhida Stadium';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '08:00:00', '17:00:00'),
                (v_place_id, 2, '08:00:00', '17:00:00'),
                (v_place_id, 3, '08:00:00', '17:00:00'),
                (v_place_id, 4, '08:00:00', '17:00:00'),
                (v_place_id, 5, '08:00:00', '17:00:00'),
                (v_place_id, 6, '08:00:00', '17:00:00'),
                (v_place_id, 7, '08:00:00', '17:00:00');
        END IF;
    END IF;

    -- 110. Monarch
    SELECT id INTO v_place_id FROM places WHERE name = 'Monarch';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 5, '21:00:00', '04:00:00'),
                (v_place_id, 6, '21:00:00', '04:00:00');
        END IF;
    END IF;

    -- 111. Moo Moo & The Wild Bean
    SELECT id INTO v_place_id FROM places WHERE name = 'Moo Moo & The Wild Bean';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '11:00:00', '22:00:00'),
                (v_place_id, 2, '11:00:00', '22:00:00'),
                (v_place_id, 3, '11:00:00', '22:00:00'),
                (v_place_id, 4, '11:00:00', '22:00:00'),
                (v_place_id, 5, '11:00:00', '22:00:00'),
                (v_place_id, 6, '11:00:00', '22:00:00'),
                (v_place_id, 7, '11:00:00', '22:00:00');
        END IF;
    END IF;

    -- 112. The LivingRoom at Summerhill Guest Estate
    SELECT id INTO v_place_id FROM places WHERE name = 'The LivingRoom at Summerhill Guest Estate';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 2, '12:00:00', '22:00:00'),
                (v_place_id, 3, '12:00:00', '22:00:00'),
                (v_place_id, 4, '12:00:00', '22:00:00'),
                (v_place_id, 5, '12:00:00', '22:00:00'),
                (v_place_id, 6, '12:00:00', '22:00:00');
        END IF;
    END IF;

    -- 113. The Market Theatre
    SELECT id INTO v_place_id FROM places WHERE name = 'The Market Theatre';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 3, '09:00:00', '19:00:00'),
                (v_place_id, 4, '09:00:00', '19:00:00'),
                (v_place_id, 5, '09:00:00', '19:00:00'),
                (v_place_id, 6, '09:00:00', '19:00:00'),
                (v_place_id, 7, '11:00:00', '15:00:00');
        END IF;
    END IF;

    -- 114. The Neighbourgoods Market
    SELECT id INTO v_place_id FROM places WHERE name = 'The Neighbourgoods Market';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 6, '09:00:00', '16:00:00');
        END IF;
    END IF;

    -- 115. The Orbit Jazz Club & Bistro
    SELECT id INTO v_place_id FROM places WHERE name = 'The Orbit Jazz Club & Bistro';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 2, '18:00:00', '02:00:00'),
                (v_place_id, 3, '18:00:00', '02:00:00'),
                (v_place_id, 4, '18:00:00', '02:00:00'),
                (v_place_id, 5, '18:00:00', '02:00:00'),
                (v_place_id, 6, '18:00:00', '02:00:00');
        END IF;
    END IF;

    -- 116. The Oyster Box Restaurant
    SELECT id INTO v_place_id FROM places WHERE name = 'The Oyster Box Restaurant';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '07:00:00', '22:00:00'),
                (v_place_id, 2, '07:00:00', '22:00:00'),
                (v_place_id, 3, '07:00:00', '22:00:00'),
                (v_place_id, 4, '07:00:00', '22:00:00'),
                (v_place_id, 5, '07:00:00', '22:00:00'),
                (v_place_id, 6, '07:00:00', '22:00:00'),
                (v_place_id, 7, '07:00:00', '22:00:00');
        END IF;
    END IF;

    -- 117. The Power & the Glory / The Moveable Feast
    SELECT id INTO v_place_id FROM places WHERE name = 'The Power & the Glory / The Moveable Feast';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '08:00:00', '02:00:00'),
                (v_place_id, 2, '08:00:00', '02:00:00'),
                (v_place_id, 3, '08:00:00', '02:00:00'),
                (v_place_id, 4, '08:00:00', '02:00:00'),
                (v_place_id, 5, '08:00:00', '02:00:00'),
                (v_place_id, 6, '08:00:00', '02:00:00'),
                (v_place_id, 7, '08:00:00', '22:00:00');
        END IF;
    END IF;

    -- 118. The Silo District
    SELECT id INTO v_place_id FROM places WHERE name = 'The Silo District';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '09:00:00', '21:00:00'),
                (v_place_id, 2, '09:00:00', '21:00:00'),
                (v_place_id, 3, '09:00:00', '21:00:00'),
                (v_place_id, 4, '09:00:00', '21:00:00'),
                (v_place_id, 5, '09:00:00', '21:00:00'),
                (v_place_id, 6, '09:00:00', '21:00:00'),
                (v_place_id, 7, '09:00:00', '21:00:00');
        END IF;
    END IF;

    -- 119. The Waiting Room
    SELECT id INTO v_place_id FROM places WHERE name = 'The Waiting Room';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 4, '20:00:00', '02:00:00'),
                (v_place_id, 5, '20:00:00', '02:00:00'),
                (v_place_id, 6, '20:00:00', '02:00:00');
        END IF;
    END IF;

    -- 120. Theatre on the Bay
    SELECT id INTO v_place_id FROM places WHERE name = 'Theatre on the Bay';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '09:30:00', '17:00:00'),
                (v_place_id, 2, '09:30:00', '17:00:00'),
                (v_place_id, 3, '09:30:00', '17:00:00'),
                (v_place_id, 4, '09:30:00', '17:00:00'),
                (v_place_id, 5, '09:30:00', '17:00:00'),
                (v_place_id, 6, '09:30:00', '17:00:00');
        END IF;
    END IF;

    -- 121. Tiger's Milk (Camps Bay)
    SELECT id INTO v_place_id FROM places WHERE name = 'Tiger''s Milk (Camps Bay)';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '09:00:00', '00:00:00'),
                (v_place_id, 2, '09:00:00', '00:00:00'),
                (v_place_id, 3, '09:00:00', '00:00:00'),
                (v_place_id, 4, '09:00:00', '00:00:00'),
                (v_place_id, 5, '09:00:00', '00:00:00'),
                (v_place_id, 6, '09:00:00', '00:00:00'),
                (v_place_id, 7, '09:00:00', '00:00:00');
        END IF;
    END IF;

    -- 122. Tiger's Milk (Kloof Street)
    SELECT id INTO v_place_id FROM places WHERE name = 'Tiger''s Milk (Kloof Street)';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '10:00:00', '00:00:00'),
                (v_place_id, 2, '10:00:00', '00:00:00'),
                (v_place_id, 3, '10:00:00', '00:00:00'),
                (v_place_id, 4, '10:00:00', '00:00:00'),
                (v_place_id, 5, '10:00:00', '00:00:00'),
                (v_place_id, 6, '10:00:00', '00:00:00'),
                (v_place_id, 7, '10:00:00', '00:00:00');
        END IF;
    END IF;

    -- 123. Truth Coffee Roasting
    FOR v_place_id IN SELECT id FROM places WHERE name = 'Truth Coffee Roasting' LOOP
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '07:00:00', '18:00:00'),
                (v_place_id, 2, '07:00:00', '18:00:00'),
                (v_place_id, 3, '07:00:00', '18:00:00'),
                (v_place_id, 4, '07:00:00', '18:00:00'),
                (v_place_id, 5, '07:00:00', '18:00:00'),
                (v_place_id, 6, '08:00:00', '18:00:00'),
                (v_place_id, 7, '08:00:00', '16:00:00');
        END IF;
    END LOOP;

    -- 124. Truth Night Club
    SELECT id INTO v_place_id FROM places WHERE name = 'Truth Night Club';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 5, '21:00:00', '04:00:00'),
                (v_place_id, 6, '21:00:00', '04:00:00');
        END IF;
    END IF;

    -- 125. Twenty Twenty Club
    SELECT id INTO v_place_id FROM places WHERE name = 'Twenty Twenty Club';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '07:00:00', '21:00:00'),
                (v_place_id, 2, '07:00:00', '21:00:00'),
                (v_place_id, 3, '07:00:00', '21:00:00'),
                (v_place_id, 4, '07:00:00', '21:00:00'),
                (v_place_id, 5, '07:00:00', '21:00:00'),
                (v_place_id, 6, '07:00:00', '21:00:00'),
                (v_place_id, 7, '07:00:00', '21:00:00');
        END IF;
    END IF;

    -- 126. Umhlanga Promenade
    SELECT id INTO v_place_id FROM places WHERE name = 'Umhlanga Promenade';
    IF v_place_id IS NOT NULL THEN
        UPDATE places SET is_24_7 = true WHERE id = v_place_id;
    END IF;

    -- 127. Union Buildings
    SELECT id INTO v_place_id FROM places WHERE name = 'Union Buildings';
    IF v_place_id IS NOT NULL THEN
        UPDATE places SET is_24_7 = true WHERE id = v_place_id;
    END IF;

    -- 128. uShaka Marine World
    SELECT id INTO v_place_id FROM places WHERE name = 'uShaka Marine World';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '09:00:00', '17:00:00'),
                (v_place_id, 2, '09:00:00', '17:00:00'),
                (v_place_id, 3, '09:00:00', '17:00:00'),
                (v_place_id, 4, '09:00:00', '17:00:00'),
                (v_place_id, 5, '09:00:00', '17:00:00'),
                (v_place_id, 6, '09:00:00', '17:00:00'),
                (v_place_id, 7, '09:00:00', '17:00:00');
        END IF;
    END IF;

    -- 129. Van Hunks
    SELECT id INTO v_place_id FROM places WHERE name = 'Van Hunks';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '12:30:00', '01:00:00'),
                (v_place_id, 2, '12:30:00', '01:00:00'),
                (v_place_id, 3, '12:30:00', '01:00:00'),
                (v_place_id, 4, '12:30:00', '01:00:00'),
                (v_place_id, 5, '12:30:00', '01:00:00'),
                (v_place_id, 6, '12:30:00', '01:00:00'),
                (v_place_id, 7, '12:30:00', '01:00:00');
        END IF;
    END IF;

    -- 130. Victoria Yards
    SELECT id INTO v_place_id FROM places WHERE name = 'Victoria Yards';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '09:00:00', '17:00:00'),
                (v_place_id, 2, '09:00:00', '17:00:00'),
                (v_place_id, 3, '09:00:00', '17:00:00'),
                (v_place_id, 4, '09:00:00', '17:00:00'),
                (v_place_id, 5, '09:00:00', '17:00:00'),
                (v_place_id, 6, '10:00:00', '17:00:00'),
                (v_place_id, 7, '10:00:00', '16:00:00');
        END IF;
    END IF;

    -- 131. Villa San Giovanni
    SELECT id INTO v_place_id FROM places WHERE name = 'Villa San Giovanni';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '08:00:00', '21:00:00'),
                (v_place_id, 2, '08:00:00', '21:00:00'),
                (v_place_id, 3, '08:00:00', '21:00:00'),
                (v_place_id, 4, '08:00:00', '21:00:00'),
                (v_place_id, 5, '08:00:00', '21:00:00'),
                (v_place_id, 6, '08:00:00', '21:00:00'),
                (v_place_id, 7, '08:00:00', '16:00:00');
        END IF;
    END IF;

    -- 132. Voortrekker Monument
    SELECT id INTO v_place_id FROM places WHERE name = 'Voortrekker Monument';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '08:00:00', '18:00:00'),
                (v_place_id, 2, '08:00:00', '18:00:00'),
                (v_place_id, 3, '08:00:00', '18:00:00'),
                (v_place_id, 4, '08:00:00', '18:00:00'),
                (v_place_id, 5, '08:00:00', '18:00:00'),
                (v_place_id, 6, '08:00:00', '18:00:00'),
                (v_place_id, 7, '08:00:00', '18:00:00');
        END IF;
    END IF;

    -- 133. Vovo Telo
    SELECT id INTO v_place_id FROM places WHERE name = 'Vovo Telo';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '07:00:00', '18:00:00'),
                (v_place_id, 2, '07:00:00', '18:00:00'),
                (v_place_id, 3, '07:00:00', '18:00:00'),
                (v_place_id, 4, '07:00:00', '18:00:00'),
                (v_place_id, 5, '07:00:00', '18:00:00'),
                (v_place_id, 6, '07:00:00', '18:00:00'),
                (v_place_id, 7, '07:00:00', '18:00:00');
        END IF;
    END IF;

    -- 134. Walter Sisulu Gardens
    SELECT id INTO v_place_id FROM places WHERE name = 'Walter Sisulu Gardens';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '08:00:00', '17:00:00'),
                (v_place_id, 2, '08:00:00', '17:00:00'),
                (v_place_id, 3, '08:00:00', '17:00:00'),
                (v_place_id, 4, '08:00:00', '17:00:00'),
                (v_place_id, 5, '08:00:00', '17:00:00'),
                (v_place_id, 6, '08:00:00', '17:00:00'),
                (v_place_id, 7, '08:00:00', '17:00:00');
        END IF;
    END IF;

    -- 135. Wilson's Wharf
    SELECT id INTO v_place_id FROM places WHERE name = 'Wilson''s Wharf';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '09:00:00', '22:00:00'),
                (v_place_id, 2, '09:00:00', '22:00:00'),
                (v_place_id, 3, '09:00:00', '22:00:00'),
                (v_place_id, 4, '09:00:00', '22:00:00'),
                (v_place_id, 5, '09:00:00', '22:00:00'),
                (v_place_id, 6, '09:00:00', '22:00:00'),
                (v_place_id, 7, '09:00:00', '22:00:00');
        END IF;
    END IF;

    -- 136. Wings 'n Things
    SELECT id INTO v_place_id FROM places WHERE name = 'Wings ''n Things';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '11:00:00', '22:00:00'),
                (v_place_id, 2, '11:00:00', '22:00:00'),
                (v_place_id, 3, '11:00:00', '22:00:00'),
                (v_place_id, 4, '11:00:00', '22:00:00'),
                (v_place_id, 5, '11:00:00', '22:00:00'),
                (v_place_id, 6, '11:00:00', '22:00:00'),
                (v_place_id, 7, '11:00:00', '22:00:00');
        END IF;
    END IF;

    -- 137. Wits Art Museum
    SELECT id INTO v_place_id FROM places WHERE name = 'Wits Art Museum';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 2, '10:00:00', '16:00:00'),
                (v_place_id, 3, '10:00:00', '16:00:00'),
                (v_place_id, 4, '10:00:00', '16:00:00'),
                (v_place_id, 5, '10:00:00', '16:00:00'),
                (v_place_id, 6, '10:00:00', '16:00:00');
        END IF;
    END IF;

    -- 138. World of Beer
    SELECT id INTO v_place_id FROM places WHERE name = 'World of Beer';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 2, '10:00:00', '18:00:00'),
                (v_place_id, 3, '10:00:00', '18:00:00'),
                (v_place_id, 4, '10:00:00', '18:00:00'),
                (v_place_id, 5, '10:00:00', '18:00:00'),
                (v_place_id, 6, '10:00:00', '18:00:00');
        END IF;
    END IF;

    -- 139. Yours Truly
    SELECT id INTO v_place_id FROM places WHERE name = 'Yours Truly';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '08:00:00', '00:00:00'),
                (v_place_id, 2, '08:00:00', '00:00:00'),
                (v_place_id, 3, '08:00:00', '00:00:00'),
                (v_place_id, 4, '08:00:00', '00:00:00'),
                (v_place_id, 5, '08:00:00', '00:00:00'),
                (v_place_id, 6, '08:00:00', '00:00:00'),
                (v_place_id, 7, '08:00:00', '00:00:00');
        END IF;
    END IF;

    -- 140. Zeitz Museum of Contemporary Art Africa
    SELECT id INTO v_place_id FROM places WHERE name = 'Zeitz Museum of Contemporary Art Africa';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 2, '10:00:00', '18:00:00'),
                (v_place_id, 3, '10:00:00', '18:00:00'),
                (v_place_id, 4, '10:00:00', '18:00:00'),
                (v_place_id, 5, '10:00:00', '18:00:00'),
                (v_place_id, 6, '10:00:00', '18:00:00'),
                (v_place_id, 7, '10:00:00', '18:00:00');
        END IF;
    END IF;

    -- 141. Anton's Bar & Lounge
    SELECT id INTO v_place_id FROM places WHERE name = 'Anton''s Bar & Lounge';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 3, '17:00:00', '02:00:00'),
                (v_place_id, 4, '17:00:00', '02:00:00'),
                (v_place_id, 5, '17:00:00', '02:00:00'),
                (v_place_id, 6, '17:00:00', '02:00:00');
        END IF;
    END IF;

    -- 142. Banting Cafe
    SELECT id INTO v_place_id FROM places WHERE name = 'Banting Cafe';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '08:00:00', '17:00:00'),
                (v_place_id, 2, '08:00:00', '17:00:00'),
                (v_place_id, 3, '08:00:00', '17:00:00'),
                (v_place_id, 4, '08:00:00', '17:00:00'),
                (v_place_id, 5, '08:00:00', '17:00:00'),
                (v_place_id, 6, '08:00:00', '17:00:00'),
                (v_place_id, 7, '08:00:00', '17:00:00');
        END IF;
    END IF;

    -- 143. Barcelona Lounge
    SELECT id INTO v_place_id FROM places WHERE name = 'Barcelona Lounge';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '06:00:00', '22:00:00'),
                (v_place_id, 2, '06:00:00', '22:00:00'),
                (v_place_id, 3, '06:00:00', '22:00:00'),
                (v_place_id, 4, '06:00:00', '22:00:00'),
                (v_place_id, 5, '06:00:00', '22:00:00'),
                (v_place_id, 6, '06:00:00', '22:00:00'),
                (v_place_id, 7, '06:00:00', '22:00:00');
        END IF;
    END IF;

    -- 144. Café 1999
    SELECT id INTO v_place_id FROM places WHERE name = 'Café 1999';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '12:00:00', '22:00:00'),
                (v_place_id, 2, '12:00:00', '22:00:00'),
                (v_place_id, 3, '12:00:00', '22:00:00'),
                (v_place_id, 4, '12:00:00', '22:00:00'),
                (v_place_id, 5, '12:00:00', '22:00:00'),
                (v_place_id, 6, '12:00:00', '22:00:00');
        END IF;
    END IF;

    -- 145. Culinaria
    SELECT id INTO v_place_id FROM places WHERE name = 'Culinaria';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 2, '11:00:00', '21:00:00'),
                (v_place_id, 3, '11:00:00', '21:00:00'),
                (v_place_id, 4, '11:00:00', '21:00:00'),
                (v_place_id, 5, '11:00:00', '21:00:00'),
                (v_place_id, 6, '11:00:00', '21:00:00');
        END IF;
    END IF;

    -- 146. Dine at The Orient
    SELECT id INTO v_place_id FROM places WHERE name = 'Dine at The Orient';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 3, '12:00:00', '15:00:00'),
                (v_place_id, 4, '12:00:00', '15:00:00'),
                (v_place_id, 5, '12:00:00', '15:00:00'),
                (v_place_id, 6, '12:00:00', '15:00:00'),
                (v_place_id, 7, '12:00:00', '15:00:00');
        END IF;
    END IF;

    -- 147. Jameson Distillery Tour Bar
    SELECT id INTO v_place_id FROM places WHERE name = 'Jameson Distillery Tour Bar';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '10:00:00', '18:00:00'),
                (v_place_id, 2, '10:00:00', '18:00:00'),
                (v_place_id, 3, '10:00:00', '18:00:00'),
                (v_place_id, 4, '10:00:00', '18:00:00'),
                (v_place_id, 5, '10:00:00', '18:00:00'),
                (v_place_id, 6, '10:00:00', '18:00:00'),
                (v_place_id, 7, '10:00:00', '18:00:00');
        END IF;
    END IF;

    -- 148. Johan's at No. 1
    SELECT id INTO v_place_id FROM places WHERE name = 'Johan''s at No. 1';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '11:00:00', '22:00:00'),
                (v_place_id, 2, '11:00:00', '22:00:00'),
                (v_place_id, 3, '11:00:00', '22:00:00'),
                (v_place_id, 4, '11:00:00', '22:00:00'),
                (v_place_id, 5, '11:00:00', '22:00:00'),
                (v_place_id, 6, '11:00:00', '22:00:00'),
                (v_place_id, 7, '11:00:00', '22:00:00');
        END IF;
    END IF;

    -- 149. Kiepersol Restaurant
    SELECT id INTO v_place_id FROM places WHERE name = 'Kiepersol Restaurant';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 2, '11:00:00', '21:00:00'),
                (v_place_id, 3, '11:00:00', '21:00:00'),
                (v_place_id, 4, '11:00:00', '21:00:00'),
                (v_place_id, 5, '11:00:00', '21:00:00'),
                (v_place_id, 6, '11:00:00', '21:00:00');
        END IF;
    END IF;

    -- 150. Klitsgras Drumming
    SELECT id INTO v_place_id FROM places WHERE name = 'Klitsgras Drumming';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 6, '16:00:00', '00:00:00');
        END IF;
    END IF;

    -- 151. Louis
    SELECT id INTO v_place_id FROM places WHERE name = 'Louis';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '11:00:00', '22:00:00'),
                (v_place_id, 2, '11:00:00', '22:00:00'),
                (v_place_id, 3, '11:00:00', '22:00:00'),
                (v_place_id, 4, '11:00:00', '22:00:00'),
                (v_place_id, 5, '11:00:00', '22:00:00'),
                (v_place_id, 6, '11:00:00', '22:00:00'),
                (v_place_id, 7, '11:00:00', '22:00:00');
        END IF;
    END IF;

    -- 152. Massimo's
    SELECT id INTO v_place_id FROM places WHERE name = 'Massimo''s';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '12:00:00', '21:00:00'),
                (v_place_id, 2, '12:00:00', '21:00:00'),
                (v_place_id, 3, '12:00:00', '21:00:00'),
                (v_place_id, 4, '12:00:00', '21:00:00'),
                (v_place_id, 5, '12:00:00', '21:00:00'),
                (v_place_id, 6, '12:00:00', '21:00:00'),
                (v_place_id, 7, '12:00:00', '21:00:00');
        END IF;
    END IF;

    -- 153. Mercury Live & Lounge
    SELECT id INTO v_place_id FROM places WHERE name = 'Mercury Live & Lounge';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 4, '20:00:00', '04:00:00'),
                (v_place_id, 5, '20:00:00', '04:00:00'),
                (v_place_id, 6, '20:00:00', '04:00:00');
        END IF;
    END IF;

    -- 154. Mitchell Park
    SELECT id INTO v_place_id FROM places WHERE name = 'Mitchell Park';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '06:00:00', '18:00:00'),
                (v_place_id, 2, '06:00:00', '18:00:00'),
                (v_place_id, 3, '06:00:00', '18:00:00'),
                (v_place_id, 4, '06:00:00', '18:00:00'),
                (v_place_id, 5, '06:00:00', '18:00:00'),
                (v_place_id, 6, '06:00:00', '18:00:00'),
                (v_place_id, 7, '06:00:00', '18:00:00');
        END IF;
    END IF;

    -- 155. Mollywood
    SELECT id INTO v_place_id FROM places WHERE name = 'Mollywood';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 5, '21:00:00', '04:00:00'),
                (v_place_id, 6, '21:00:00', '04:00:00');
        END IF;
    END IF;

    -- 156. Moonshine
    SELECT id INTO v_place_id FROM places WHERE name = 'Moonshine';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 3, '17:00:00', '02:00:00'),
                (v_place_id, 4, '17:00:00', '02:00:00'),
                (v_place_id, 5, '17:00:00', '02:00:00'),
                (v_place_id, 6, '17:00:00', '02:00:00');
        END IF;
    END IF;

    -- 157. Mountain Breeze Coffee Roastery
    SELECT id INTO v_place_id FROM places WHERE name = 'Mountain Breeze Coffee Roastery';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '08:00:00', '17:00:00'),
                (v_place_id, 2, '08:00:00', '17:00:00'),
                (v_place_id, 3, '08:00:00', '17:00:00'),
                (v_place_id, 4, '08:00:00', '17:00:00'),
                (v_place_id, 5, '08:00:00', '17:00:00'),
                (v_place_id, 6, '08:00:00', '17:00:00');
        END IF;
    END IF;

    -- 158. Moyo uShaka Pier
    SELECT id INTO v_place_id FROM places WHERE name = 'Moyo uShaka Pier';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '11:00:00', '22:00:00'),
                (v_place_id, 2, '11:00:00', '22:00:00'),
                (v_place_id, 3, '11:00:00', '22:00:00'),
                (v_place_id, 4, '11:00:00', '22:00:00'),
                (v_place_id, 5, '11:00:00', '23:00:00'),
                (v_place_id, 6, '08:00:00', '23:00:00'),
                (v_place_id, 7, '08:00:00', '22:00:00');
        END IF;
    END IF;

    -- 159. Museum of African Design
    SELECT id INTO v_place_id FROM places WHERE name = 'Museum of African Design';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 2, '10:00:00', '17:00:00'),
                (v_place_id, 3, '10:00:00', '17:00:00'),
                (v_place_id, 4, '10:00:00', '17:00:00'),
                (v_place_id, 5, '10:00:00', '17:00:00'),
                (v_place_id, 6, '10:00:00', '17:00:00'),
                (v_place_id, 7, '10:00:00', '17:00:00');
        END IF;
    END IF;

    -- 160. Okio
    SELECT id INTO v_place_id FROM places WHERE name = 'Okio';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '11:00:00', '22:00:00'),
                (v_place_id, 2, '11:00:00', '22:00:00'),
                (v_place_id, 3, '11:00:00', '22:00:00'),
                (v_place_id, 4, '11:00:00', '22:00:00'),
                (v_place_id, 5, '11:00:00', '22:00:00'),
                (v_place_id, 6, '11:00:00', '22:00:00'),
                (v_place_id, 7, '11:00:00', '22:00:00');
        END IF;
    END IF;

    -- 161. Orphanage Cocktail Emporium
    SELECT id INTO v_place_id FROM places WHERE name = 'Orphanage Cocktail Emporium';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '17:00:00', '02:00:00'),
                (v_place_id, 2, '17:00:00', '02:00:00'),
                (v_place_id, 3, '17:00:00', '02:00:00'),
                (v_place_id, 4, '17:00:00', '02:00:00'),
                (v_place_id, 5, '17:00:00', '02:00:00'),
                (v_place_id, 6, '17:00:00', '02:00:00');
        END IF;
    END IF;

    -- 162. Pablo's Mexican Cantina
    SELECT id INTO v_place_id FROM places WHERE name = 'Pablo''s Mexican Cantina';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 2, '12:00:00', '22:00:00'),
                (v_place_id, 3, '12:00:00', '22:00:00'),
                (v_place_id, 4, '12:00:00', '22:00:00'),
                (v_place_id, 5, '12:00:00', '23:00:00'),
                (v_place_id, 6, '12:00:00', '23:00:00'),
                (v_place_id, 7, '12:00:00', '21:00:00');
        END IF;
    END IF;

    -- 163. Pacha's South African Grill
    SELECT id INTO v_place_id FROM places WHERE name = 'Pacha''s South African Grill';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '12:00:00', '22:00:00'),
                (v_place_id, 2, '12:00:00', '22:00:00'),
                (v_place_id, 3, '12:00:00', '22:00:00'),
                (v_place_id, 4, '12:00:00', '22:00:00'),
                (v_place_id, 5, '12:00:00', '22:00:00'),
                (v_place_id, 6, '12:00:00', '22:00:00');
        END IF;
    END IF;

    -- 164. Peppertree
    SELECT id INTO v_place_id FROM places WHERE name = 'Peppertree';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '11:00:00', '22:00:00'),
                (v_place_id, 2, '11:00:00', '22:00:00'),
                (v_place_id, 3, '11:00:00', '22:00:00'),
                (v_place_id, 4, '11:00:00', '22:00:00'),
                (v_place_id, 5, '11:00:00', '22:00:00'),
                (v_place_id, 6, '11:00:00', '22:00:00'),
                (v_place_id, 7, '11:00:00', '22:00:00');
        END IF;
    END IF;

    -- 165. Sognage
    SELECT id INTO v_place_id FROM places WHERE name = 'Sognage';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 4, '18:00:00', '02:00:00'),
                (v_place_id, 5, '18:00:00', '04:00:00'),
                (v_place_id, 6, '18:00:00', '04:00:00');
        END IF;
    END IF;

    -- 166. St Lorient Fashion Boutique & Cafe
    SELECT id INTO v_place_id FROM places WHERE name = 'St Lorient Fashion Boutique & Cafe';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '09:00:00', '17:00:00'),
                (v_place_id, 2, '09:00:00', '17:00:00'),
                (v_place_id, 3, '09:00:00', '17:00:00'),
                (v_place_id, 4, '09:00:00', '17:00:00'),
                (v_place_id, 5, '09:00:00', '17:00:00'),
                (v_place_id, 6, '09:00:00', '13:00:00');
        END IF;
    END IF;

    -- 167. Tashas
    SELECT id INTO v_place_id FROM places WHERE name = 'Tashas';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '08:00:00', '21:00:00'),
                (v_place_id, 2, '08:00:00', '21:00:00'),
                (v_place_id, 3, '08:00:00', '21:00:00'),
                (v_place_id, 4, '08:00:00', '21:00:00'),
                (v_place_id, 5, '08:00:00', '22:00:00'),
                (v_place_id, 6, '08:00:00', '22:00:00'),
                (v_place_id, 7, '08:00:00', '21:00:00');
        END IF;
    END IF;

    -- 168. The Attic
    SELECT id INTO v_place_id FROM places WHERE name = 'The Attic';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 3, '17:00:00', '02:00:00'),
                (v_place_id, 4, '17:00:00', '02:00:00'),
                (v_place_id, 5, '17:00:00', '02:00:00'),
                (v_place_id, 6, '17:00:00', '02:00:00');
        END IF;
    END IF;

    -- 169. The Bambanani
    SELECT id INTO v_place_id FROM places WHERE name = 'The Bambanani';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '09:00:00', '20:00:00'),
                (v_place_id, 2, '09:00:00', '20:00:00'),
                (v_place_id, 3, '09:00:00', '20:00:00'),
                (v_place_id, 4, '09:00:00', '20:00:00'),
                (v_place_id, 5, '09:00:00', '21:00:00'),
                (v_place_id, 6, '09:00:00', '21:00:00'),
                (v_place_id, 7, '09:00:00', '20:00:00');
        END IF;
    END IF;

    -- 170. The Beer Library
    SELECT id INTO v_place_id FROM places WHERE name = 'The Beer Library';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 3, '16:00:00', '23:00:00'),
                (v_place_id, 4, '16:00:00', '23:00:00'),
                (v_place_id, 5, '14:00:00', '01:00:00'),
                (v_place_id, 6, '12:00:00', '01:00:00'),
                (v_place_id, 7, '12:00:00', '21:00:00');
        END IF;
    END IF;

    -- 171. The Belgian Beer Bar
    SELECT id INTO v_place_id FROM places WHERE name = 'The Belgian Beer Bar';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 2, '16:00:00', '23:00:00'),
                (v_place_id, 3, '16:00:00', '23:00:00'),
                (v_place_id, 4, '16:00:00', '23:00:00'),
                (v_place_id, 5, '14:00:00', '01:00:00'),
                (v_place_id, 6, '12:00:00', '01:00:00'),
                (v_place_id, 7, '12:00:00', '21:00:00');
        END IF;
    END IF;

    -- 172. The Gin Bar
    SELECT id INTO v_place_id FROM places WHERE name = 'The Gin Bar';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '17:00:00', '01:00:00'),
                (v_place_id, 2, '17:00:00', '01:00:00'),
                (v_place_id, 3, '17:00:00', '01:00:00'),
                (v_place_id, 4, '15:00:00', '01:00:00'),
                (v_place_id, 5, '15:00:00', '01:00:00'),
                (v_place_id, 6, '15:00:00', '01:00:00');
        END IF;
    END IF;

    -- 173. The Golden Dish
    SELECT id INTO v_place_id FROM places WHERE name = 'The Golden Dish';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '09:00:00', '03:00:00'),
                (v_place_id, 2, '09:00:00', '03:00:00'),
                (v_place_id, 3, '09:00:00', '03:00:00'),
                (v_place_id, 4, '09:00:00', '03:00:00'),
                (v_place_id, 5, '09:00:00', '05:00:00'),
                (v_place_id, 6, '09:00:00', '05:00:00');
        END IF;
    END IF;

    -- 174. The Good Luck Bar
    SELECT id INTO v_place_id FROM places WHERE name = 'The Good Luck Bar';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 4, '18:00:00', '02:00:00'),
                (v_place_id, 5, '18:00:00', '02:00:00'),
                (v_place_id, 6, '18:00:00', '02:00:00');
        END IF;
    END IF;

    -- 175. The Great Dane
    SELECT id INTO v_place_id FROM places WHERE name = 'The Great Dane';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 3, '14:00:00', '02:00:00'),
                (v_place_id, 4, '14:00:00', '02:00:00'),
                (v_place_id, 5, '14:00:00', '02:00:00'),
                (v_place_id, 6, '14:00:00', '02:00:00');
        END IF;
    END IF;

    -- 176. The Griffin
    SELECT id INTO v_place_id FROM places WHERE name = 'The Griffin';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 2, '12:00:00', '23:00:00'),
                (v_place_id, 3, '12:00:00', '23:00:00'),
                (v_place_id, 4, '12:00:00', '23:00:00'),
                (v_place_id, 5, '12:00:00', '00:00:00'),
                (v_place_id, 6, '12:00:00', '00:00:00'),
                (v_place_id, 7, '12:00:00', '21:00:00');
        END IF;
    END IF;

    -- 177. Unity Brasserie & Bar
    SELECT id INTO v_place_id FROM places WHERE name = 'Unity Brasserie & Bar';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '11:00:00', '22:00:00'),
                (v_place_id, 2, '11:00:00', '22:00:00'),
                (v_place_id, 3, '11:00:00', '22:00:00'),
                (v_place_id, 4, '11:00:00', '22:00:00'),
                (v_place_id, 5, '11:00:00', '22:00:00'),
                (v_place_id, 6, '11:00:00', '22:00:00');
        END IF;
    END IF;

    -- 178. The Bike and Bean
    SELECT id INTO v_place_id FROM places WHERE name = 'The Bike and Bean';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '06:00:00', '17:00:00'),
                (v_place_id, 2, '06:00:00', '17:00:00'),
                (v_place_id, 3, '06:00:00', '17:00:00'),
                (v_place_id, 4, '06:00:00', '17:00:00'),
                (v_place_id, 5, '06:00:00', '17:00:00'),
                (v_place_id, 6, '06:00:00', '17:00:00'),
                (v_place_id, 7, '06:00:00', '17:00:00');
        END IF;
    END IF;

    -- 179. The Grove Mall
    SELECT id INTO v_place_id FROM places WHERE name = 'The Grove Mall';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 1, '09:00:00', '19:00:00'),
                (v_place_id, 2, '09:00:00', '19:00:00'),
                (v_place_id, 3, '09:00:00', '19:00:00'),
                (v_place_id, 4, '09:00:00', '19:00:00'),
                (v_place_id, 5, '09:00:00', '19:00:00'),
                (v_place_id, 6, '09:00:00', '19:00:00'),
                (v_place_id, 7, '09:00:00', '19:00:00');
        END IF;
    END IF;

    -- 180. The Marabi Club
    SELECT id INTO v_place_id FROM places WHERE name = 'The Marabi Club';
    IF v_place_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operating_hours WHERE place_id = v_place_id) THEN
            INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time)
            VALUES 
                (v_place_id, 4, '18:00:00', '00:00:00'),
                (v_place_id, 5, '18:00:00', '00:00:00'),
                (v_place_id, 6, '18:00:00', '00:00:00');
        END IF;
    END IF;

END $$;
