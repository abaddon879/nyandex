-- This script transforms data from the temporary tables (loaded from CSVs)
-- and inserts it into the final, permanent tables as defined in your db_setup.sql.
START TRANSACTION;

-- =================================================================================
-- Step 1: Populate the `cat` table
-- =================================================================================
INSERT INTO cat (cat_id, cat_order_id, rarity_id, boostable, max_level, max_plus_level, introduced_version_id)
SELECT
    ub.cat_id,
    ub.col_15 AS cat_order_id,
    ub.col_14 AS rarity_id,
    ub.col_50 AS boostable,
    ub.col_51 AS max_level,
    ub.col_52 AS max_plus_level,
    '{{VERSION}}' AS introduced_version_id -- Add the placeholder to the SELECT list

FROM
    (SELECT *, (ROW_NUMBER() OVER (ORDER BY id) - 1) AS cat_id FROM temp_unit_evolutions) AS ub
JOIN
    (SELECT *, (ROW_NUMBER() OVER (ORDER BY id) - 1) AS cat_id FROM temp_picture_book_data) AS pb
    ON ub.cat_id = pb.cat_id
WHERE
    pb.col_1 > 0
    AND ub.col_15 >= 0
ON DUPLICATE KEY UPDATE
    cat_order_id = VALUES(cat_order_id),
    rarity_id = VALUES(rarity_id),
    boostable = VALUES(boostable),
    max_level = VALUES(max_level),
    max_plus_level = VALUES(max_plus_level);


-- =================================================================================
-- Step 2: Populate the `cat_form` table
-- =================================================================================
INSERT INTO cat_form (cat_id, form_id, form_name, description, required_level, required_xp, egg_id, image_url, introduced_version_id)
SELECT
    ub.cat_id,
    ex.col_2 as form_id, -- Assuming col_2 in unit_explanations is the form_id
    ex.col_3 as form_name, -- Assuming col_3 is the name
    CONCAT_WS(
        CHAR(13, 10), -- The separator is a newline character
        NULLIF(ex.col_4, ''), -- Convert empty strings to NULL so CONCAT_WS skips them
        NULLIF(ex.col_5, ''),
        NULLIF(ex.col_6, ''),
        NULLIF(ex.col_7, ''),
        NULLIF(ex.col_8, ''),
        NULLIF(ex.col_9, ''),
        NULLIF(ex.col_10, ''),
        NULLIF(ex.col_11, ''),
        NULLIF(ex.col_12, ''),
        NULLIF(ex.col_13, '')
    ) AS description,
    CASE
        WHEN ex.col_2 = 1 THEN NULL
        WHEN ex.col_2 = 2 THEN ub.col_22
        WHEN ex.col_2 = 3 AND ub.col_14 = 0 THEN ub.col_21
        WHEN ex.col_2 = 3 THEN ub.col_26
        WHEN ex.col_2 = 4 THEN ub.col_27
        ELSE 99
    END AS required_level,
    CASE
        WHEN ex.col_2 = 1 THEN NULL
        WHEN ex.col_2 = 2 THEN NULL
        WHEN ex.col_2 = 3 THEN ub.col_28
        WHEN ex.col_2 = 4 THEN ub.col_39
        ELSE 1
    END AS required_xp,
    CASE
        WHEN ex.col_2 = 1 AND ub.col_62 <> -1 THEN ub.col_62
        WHEN ex.col_2 = 2 AND ub.col_62 <> -1 THEN ub.col_63
        ELSE NULL
    END AS egg_id,
    CASE
        WHEN ex.col_2 = 1 AND ub.col_62 <> -1 THEN CONCAT('uni', LPAD(ub.col_62, 3, '0'), '_m00.png')
        WHEN ex.col_2 = 1 AND ub.col_62 = -1 THEN CONCAT('uni', LPAD(ub.id -1, 3, '0'), '_f00.png')
        WHEN ex.col_2 = 2 AND ub.col_62 <> -1 THEN CONCAT('uni', LPAD(ub.col_63, 3, '0'), '_m00.png')
        WHEN ex.col_2 = 2 AND ub.col_62 = -1 THEN CONCAT('uni', LPAD(ub.id -1, 3, '0'), '_c00.png')
        WHEN ex.col_2 = 3 THEN CONCAT('uni', LPAD(ub.id -1, 3, '0'), '_s00.png')
        WHEN ex.col_2 = 4 THEN CONCAT('uni', LPAD(ub.id -1, 3, '0'), '_u00.png')
    END AS image_url,
    '{{VERSION}}' AS introduced_version_id
FROM
    (SELECT *, (ROW_NUMBER() OVER (ORDER BY id) - 1) AS cat_id FROM temp_unit_evolutions) AS ub
JOIN
    (SELECT *, (ROW_NUMBER() OVER (ORDER BY id) - 1) AS cat_id FROM temp_picture_book_data) AS pb
    ON ub.cat_id = pb.cat_id
JOIN
    temp_unit_explanations ex ON ub.cat_id = (ex.col_1 - 1)-- Query the temporary table
WHERE
    pb.col_1 > 0
AND ex.col_2 <= pb.col_3
AND ub.col_15 >= 0
ON DUPLICATE KEY UPDATE
    form_name = VALUES(form_name),
    description = VALUES(description),
    required_level = VALUES(required_level),
    required_xp = VALUES(required_xp),
    egg_id = VALUES(egg_id),
    image_url = VALUES(image_url);


-- =================================================================================
-- Step 3: Populate the `cat_form_requirement` table
-- =================================================================================
INSERT INTO cat_form_requirement (cat_id, form_id, item_id, item_qty)
SELECT
    ub.cat_id,
    forms.form_id,
    CASE forms.item_pair_index
        WHEN 1 THEN CASE forms.form_id WHEN 3 THEN ub.col_29 WHEN 4 THEN ub.col_40 END
        WHEN 2 THEN CASE forms.form_id WHEN 3 THEN ub.col_31 WHEN 4 THEN ub.col_42 END
        WHEN 3 THEN CASE forms.form_id WHEN 3 THEN ub.col_33 WHEN 4 THEN ub.col_44 END
        WHEN 4 THEN CASE forms.form_id WHEN 3 THEN ub.col_35 WHEN 4 THEN ub.col_46 END
        WHEN 5 THEN CASE forms.form_id WHEN 3 THEN ub.col_37 WHEN 4 THEN ub.col_48 END
    END AS item_id,
    CASE forms.item_pair_index
        WHEN 1 THEN CASE forms.form_id WHEN 3 THEN ub.col_30 WHEN 4 THEN ub.col_41 END
        WHEN 2 THEN CASE forms.form_id WHEN 3 THEN ub.col_32 WHEN 4 THEN ub.col_43 END
        WHEN 3 THEN CASE forms.form_id WHEN 3 THEN ub.col_34 WHEN 4 THEN ub.col_45 END
        WHEN 4 THEN CASE forms.form_id WHEN 3 THEN ub.col_36 WHEN 4 THEN ub.col_47 END
        WHEN 5 THEN CASE forms.form_id WHEN 3 THEN ub.col_38 WHEN 4 THEN ub.col_49 END
    END AS item_qty
FROM
    (SELECT *, (ROW_NUMBER() OVER (ORDER BY id) - 1) AS cat_id FROM temp_unit_evolutions) AS ub
JOIN
    (SELECT *, (ROW_NUMBER() OVER (ORDER BY id) - 1) AS cat_id FROM temp_picture_book_data) AS pb
    ON ub.cat_id = pb.cat_id
CROSS JOIN
    (
        SELECT 3 AS form_id, 1 AS item_pair_index
        UNION ALL SELECT 3, 2
        UNION ALL SELECT 3, 3
        UNION ALL SELECT 3, 4
        UNION ALL SELECT 3, 5
        UNION ALL SELECT 4, 1
        UNION ALL SELECT 4, 2
        UNION ALL SELECT 4, 3
        UNION ALL SELECT 4, 4
        UNION ALL SELECT 4, 5
    ) AS forms
WHERE
    pb.col_1 > 0
    AND (
        (forms.form_id = 3 AND CASE forms.item_pair_index
                                WHEN 1 THEN ub.col_30
                                WHEN 2 THEN ub.col_32
                                WHEN 3 THEN ub.col_34
                                WHEN 4 THEN ub.col_36
                                WHEN 5 THEN ub.col_38
                              END > 0)
        OR
        (forms.form_id = 4 AND CASE forms.item_pair_index
                                WHEN 1 THEN ub.col_41
                                WHEN 2 THEN ub.col_43
                                WHEN 3 THEN ub.col_45
                                WHEN 4 THEN ub.col_47
                                WHEN 5 THEN ub.col_49
                              END > 0)
    )
ON DUPLICATE KEY UPDATE
    item_qty = VALUES(item_qty);


-- =================================================================================
-- Step 4: Populate the `cat_form_stat` table
-- =================================================================================
-- Purpose: Extracts the Level 1 base stats from the raw unit data file
--          and inserts them into the normalized stats table.
-- Source:  temp_unit_evolutions (loaded from units.csv)
-- Target:  cat_form_stat



INSERT INTO cat_form_stat (
    cat_id,
    form_id,
    health,
    knockbacks,
    move_speed,
    attack_power,
    attack_range,
    attack_frequency_f,
    attack_foreswing_f,
    attack_backswing_f,
    recharge_time_f,
    cost,
    attack_type,
    hit_count
)
SELECT
    -- col_0 and col_1 are the cat_id and form_id added by CsvMergeController
    -- FIX: Column index shifted from col_0 -> col_1, col_1 -> col_2, etc.
    CAST(us.col_1 AS UNSIGNED) AS cat_id,
    CAST(us.col_2 AS UNSIGNED) AS form_id,
    
    -- Stat Mapping based on units.csv inspection
    -- FIX: All column indexes shifted +1
    CAST(us.col_3 AS SIGNED) AS health,
    CAST(us.col_4 AS SIGNED) AS knockbacks,
    CAST(us.col_5 AS SIGNED) AS move_speed,
    CAST(us.col_6 AS SIGNED) AS attack_power,
    CAST(us.col_8 AS SIGNED) AS attack_range,
    CAST(us.col_7 AS SIGNED) AS attack_frequency_f,
    CAST(us.col_16 AS SIGNED) AS attack_foreswing_f,
    CAST(us.col_18 AS SIGNED) AS attack_backswing_f,
    CAST(us.col_10 AS SIGNED) AS recharge_time_f,
    CAST(us.col_9 AS SIGNED) AS cost,
    
    -- Convert attack_type from number to ENUM string
    CASE 
        WHEN us.col_15 = '0' THEN 'Single'
        WHEN us.col_15 = '1' THEN 'Area'
        ELSE 'Single' -- Default to Single if data is unexpected
    END AS attack_type,
    
    -- ASSUMPTION: hit_count is 1. 
    1 AS hit_count

FROM
    temp_unit_stats AS us
WHERE
    -- Ensure the cat_id exists in our main `cat` table
    us.col_1 IN (SELECT cat_id FROM cat)
    
    -- Ensure the form_id is a valid form for that cat
    AND us.col_2 IN (SELECT form_id FROM cat_form WHERE cat_form.cat_id = us.col_1)

-- On duplicate, update all stats to the new version's values
ON DUPLICATE KEY UPDATE
    health = VALUES(health),
    knockbacks = VALUES(knockbacks),
    move_speed = VALUES(move_speed),
    attack_power = VALUES(attack_power),
    attack_range = VALUES(attack_range),
    attack_frequency_f = VALUES(attack_frequency_f),
    attack_foreswing_f = VALUES(attack_foreswing_f),
    attack_backswing_f = VALUES(attack_backswing_f),
    recharge_time_f = VALUES(recharge_time_f),
    cost = VALUES(cost),
    attack_type = VALUES(attack_type),
    hit_count = VALUES(hit_count);

COMMIT;