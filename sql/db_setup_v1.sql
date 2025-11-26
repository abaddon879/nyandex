-- Core Static Tables --

CREATE TABLE version (
    version_id VARCHAR(15) NOT NULL PRIMARY KEY,
    release_date DATE NOT NULL,
    download_date TIMESTAMP NULL DEFAULT NULL
);

CREATE TABLE rarity (
    rarity_id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
    rarity_name VARCHAR(20) NOT NULL UNIQUE
);

INSERT INTO rarity (rarity_id, rarity_name) VALUES
(0, 'Normal'),
(1, 'Special'),
(2, 'Rare'),
(3, 'Super Rare'),
(4, 'Uber Rare'),
(5, 'Legend Rare');

CREATE TABLE form (
    form_id TINYINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    form_name VARCHAR(15) NOT NULL UNIQUE
);

INSERT INTO form (form_name) VALUES
('Normal'),
('Evolved'),
('True'),
('Ultra');

CREATE TABLE item (
    item_id SMALLINT UNSIGNED NOT NULL PRIMARY KEY,
    item_type ENUM('Battle Item','Catseed','Catfruit','Catseye','Catamin','Material','Material Z','Ticket','Currency','XP','NP','Other') NOT NULL,
    item_name VARCHAR(50) NOT NULL UNIQUE,
    image_url VARCHAR(255) DEFAULT NULL
);

CREATE TABLE trait (
    trait_id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
    trait_name VARCHAR(20) NOT NULL UNIQUE,
    image_url VARCHAR(255) DEFAULT NULL
);


-- Cat-Specific Static Tables --

CREATE TABLE cat (
    cat_id SMALLINT UNSIGNED NOT NULL PRIMARY KEY,
    cat_order_id MEDIUMINT UNSIGNED NOT NULL UNIQUE,
    rarity_id TINYINT UNSIGNED NOT NULL,
    boostable TINYINT NOT NULL COMMENT '-1=Normal(20), 1=Gacha(1), 30=Boostable',
    max_level TINYINT UNSIGNED NOT NULL,
    max_plus_level TINYINT UNSIGNED NOT NULL,
    level_curve JSON NULL COMMENT 'Array of growth % per level (from unitlevel.csv)',
    introduced_version_id VARCHAR(15) DEFAULT NULL,
    FOREIGN KEY (rarity_id) REFERENCES rarity(rarity_id),
    FOREIGN KEY (introduced_version_id) REFERENCES version(version_id),
    INDEX idx_introduced_version_id (introduced_version_id)
);

CREATE TABLE cat_form (
    cat_id SMALLINT UNSIGNED NOT NULL,
    form_id TINYINT UNSIGNED NOT NULL,
    form_name VARCHAR(50) DEFAULT NULL,
    description TEXT DEFAULT NULL,
    required_level TINYINT DEFAULT NULL,
    required_xp MEDIUMINT UNSIGNED DEFAULT NULL,
    egg_id TINYINT UNSIGNED DEFAULT NULL,
    image_url VARCHAR(255) DEFAULT NULL,
    introduced_version_id VARCHAR(15) DEFAULT NULL,
    PRIMARY KEY (cat_id, form_id),
    FOREIGN KEY (cat_id) REFERENCES cat(cat_id) ON DELETE CASCADE,
    FOREIGN KEY (form_id) REFERENCES form(form_id),
    FOREIGN KEY (introduced_version_id) REFERENCES version(version_id),
    INDEX idx_cat_form_name (form_name),
    INDEX idx_introduced_version_id (introduced_version_id)
);

CREATE TABLE cat_form_stat (
    -- 1. IDENTITY
  cat_id smallint UNSIGNED NOT NULL,
  form_id tinyint UNSIGNED NOT NULL,

  -- 2. CORE STATS (Survivability & Movement)
  health int UNSIGNED NOT NULL,
  knockbacks tinyint UNSIGNED NOT NULL,
  move_speed tinyint UNSIGNED NOT NULL,
  cost smallint UNSIGNED NOT NULL,

  -- 3. ATTACK SUMMARY (The "Face" Stats)
  attack_power int UNSIGNED NOT NULL COMMENT 'Sum of all hits',
  attack_range smallint UNSIGNED NOT NULL,
  attack_type tinyint UNSIGNED NOT NULL COMMENT '0=Single, 1=Area',
  
-- 4. DAMAGE BREAKDOWN (Grouped together for easy comparison)
  attack_hit_1_power int UNSIGNED NOT NULL,
  attack_hit_2_power int UNSIGNED NOT NULL DEFAULT 0,
  attack_hit_3_power int UNSIGNED NOT NULL DEFAULT 0,

  -- 5. TIMING BREAKDOWN (Grouped together to visualize the animation)
  attack_hit_1_f smallint UNSIGNED NOT NULL COMMENT 'Previously foreswing',
  attack_hit_2_f smallint UNSIGNED NOT NULL DEFAULT 0,
  attack_hit_3_f smallint UNSIGNED NOT NULL DEFAULT 0,
  
  -- 6. CYCLE & RECOVERY
  attack_frequency_f smallint UNSIGNED NOT NULL COMMENT 'Time between attacks',
  attack_backswing_f smallint UNSIGNED NOT NULL COMMENT 'Post-attack vulnerability',
  recharge_time_f smallint UNSIGNED NOT NULL COMMENT 'Respawn time',
  
  PRIMARY KEY (cat_id, form_id),
  FOREIGN KEY (cat_id, form_id) REFERENCES cat_form (cat_id, form_id) ON DELETE CASCADE
);

CREATE TABLE cat_form_trait (
    cat_id SMALLINT UNSIGNED NOT NULL,
    form_id TINYINT UNSIGNED NOT NULL,
    trait_id TINYINT UNSIGNED NOT NULL,
    PRIMARY KEY (cat_id, form_id, trait_id),
    FOREIGN KEY (cat_id, form_id) REFERENCES cat_form (cat_id, form_id) ON DELETE CASCADE,
    FOREIGN KEY (trait_id) REFERENCES trait (trait_id)
);

CREATE TABLE cat_form_requirement (
    cat_id SMALLINT UNSIGNED NOT NULL,
    form_id TINYINT UNSIGNED NOT NULL,
    item_id SMALLINT UNSIGNED NOT NULL,
    item_qty TINYINT UNSIGNED NOT NULL,
    PRIMARY KEY (cat_id, form_id, item_id),
    FOREIGN KEY (cat_id, form_id) REFERENCES cat_form (cat_id, form_id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES item (item_id)
);


-- User Account & Progress Tables --

CREATE TABLE user (
    user_id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) DEFAULT NULL UNIQUE,
    email VARCHAR(255) DEFAULT NULL UNIQUE,
    password_hash VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP NULL DEFAULT NULL,
    last_accessed_at TIMESTAMP NULL DEFAULT NULL,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    `admin` BOOLEAN NOT NULL DEFAULT FALSE,
    `anonymous` BOOLEAN NOT NULL DEFAULT TRUE,
    INDEX idx_cleanup (`anonymous`, last_accessed_at)
);

CREATE TABLE auth_token (
    token_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    token_hash VARCHAR(64) NOT NULL UNIQUE, 
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP NULL,
    INDEX idx_user_id (user_id), 
    CONSTRAINT fk_token_user
        FOREIGN KEY (user_id) REFERENCES user(user_id)
        ON DELETE CASCADE
);

CREATE TABLE user_cat (
    user_id INT UNSIGNED NOT NULL,
    cat_id SMALLINT UNSIGNED NOT NULL,
    `level` TINYINT UNSIGNED NOT NULL,
    plus_level TINYINT UNSIGNED NOT NULL DEFAULT 0,
    form_id TINYINT UNSIGNED NOT NULL,
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (user_id, cat_id),
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE,
    FOREIGN KEY (cat_id) REFERENCES cat(cat_id),
    FOREIGN KEY (cat_id, form_id) REFERENCES cat_form(cat_id, form_id),
    INDEX idx_cat_id (cat_id)
);

CREATE TABLE user_item (
    user_id INT UNSIGNED NOT NULL,
    item_id SMALLINT UNSIGNED NOT NULL,
    item_quantity INT UNSIGNED NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP NULL,
    PRIMARY KEY (user_id, item_id),
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES item(item_id)
);

CREATE TABLE user_pinned_cat (
    user_id INT UNSIGNED NOT NULL,
    cat_id SMALLINT UNSIGNED NOT NULL,
    pinned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, cat_id),
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE,
    FOREIGN KEY (cat_id) REFERENCES cat(cat_id)
);


/*
|-----------------------------------------------------|
|*****************************************************|
|                                                     |
|  THE FOLLOWING ARE WIP TABLES FOR LATER DEVELOPMENT |
|                                                     |
|*****************************************************|
|-----------------------------------------------------|



CREATE TABLE `talent` (
  talent_id tinyint UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  talent_name varchar(50) NOT NULL UNIQUE,
  INDEX idx_talent_name (talent_name)
);

CREATE TABLE cat_form_talent (
    cat_id SMALLINT UNSIGNED NOT NULL,
    form_id TINYINT UNSIGNED NOT NULL,
    talent_id TINYINT UNSIGNED NOT NULL,
    max_level TINYINT UNSIGNED DEFAULT 1,
    PRIMARY KEY (cat_id, form_id, talent_id),
    FOREIGN KEY (cat_id, form_id) REFERENCES cat_form(cat_id, form_id),
    FOREIGN KEY (talent_id) REFERENCES talent(talent_id)
);



CREATE TABLE `ability` (
    ability_id SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ability_name VARCHAR(50) NOT NULL UNIQUE,
    description_template VARCHAR(255) NULL,
    image_url VARCHAR(255) DEFAULT NULL
);

CREATE TABLE `cat_form_ability` (
    `cat_form_ability_id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `cat_id` SMALLINT UNSIGNED NOT NULL,
    `form_id` TINYINT UNSIGNED NOT NULL,
    `ability_id` SMALLINT UNSIGNED NOT NULL, -- FK to ability table

    -- Common Params
    `proc_chance` TINYINT UNSIGNED NULL COMMENT '% chance',
    `duration_frames` SMALLINT UNSIGNED NULL COMMENT 'Effect duration frames',

    -- Specific Params (Examples - Needs expansion based on BCU analysis)
    `wave_level` TINYINT UNSIGNED NULL,
    `crit_chance` TINYINT UNSIGNED NULL,
    `ld_min_range` SMALLINT UNSIGNED NULL,
    `ld_max_range` SMALLINT UNSIGNED NULL,
    `shield_hp` INT UNSIGNED NULL,
    -- ... ADD MANY MORE SPECIFIC COLUMNS ...

    FOREIGN KEY (`cat_id`, `form_id`) REFERENCES `cat_form` (`cat_id`, `form_id`) ON DELETE CASCADE,
    FOREIGN KEY (`ability_id`) REFERENCES `ability` (`ability_id`),
    FOREIGN KEY (`vs_trait_id`) REFERENCES `trait` (`trait_id`),
    INDEX `idx_cat_form` (`cat_id`, `form_id`)
);


/*
BASES
-----
Stores the different base types available in the game.
*/
CREATE TABLE base (
    base_id TINYINT UNSIGNED PRIMARY KEY,
    base_name VARCHAR(50) NOT NULL UNIQUE,
    INDEX idx_base_name (base_name)  -- Index for searching by base name
);


/*
BASE REQUIREMENTS
-----------------
Stores the item requirements for upgrading bases to certain levels.
*/
CREATE TABLE base_requirement (
    base_id TINYINT UNSIGNED NOT NULL,
    base_level SMALLINT UNSIGNED NOT NULL,
    item_id SMALLINT UNSIGNED NOT NULL,
    item_qty SMALLINT UNSIGNED NOT NULL,
    PRIMARY KEY (base_id, base_level, item_id),
    FOREIGN KEY (base_id) REFERENCES base(base_id),
    FOREIGN KEY (item_id) REFERENCES item(item_id)
);


/*
USER BASES
----------
Stores the levels of different bases owned by each user.
*/
CREATE TABLE user_base (
    user_id INT UNSIGNED NOT NULL,
    base_id TINYINT UNSIGNED NOT NULL,
    cannon_level SMALLINT UNSIGNED NOT NULL,
    foundation_level SMALLINT UNSIGNED NOT NULL,
    style_level SMALLINT UNSIGNED NOT NULL,
	created_datetime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_datetime TIMESTAMP NULL,
    PRIMARY KEY (user_id, base_id),
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE,
    FOREIGN KEY (base_id) REFERENCES base(base_id)
);



/*
TREASURES
---------
Potentially add tables to store stage treasure.
These will be useful in calculating a units stats against various types
*/


/*
USER TREASURES
--------------
Potentially add tables to store stage treasure.
These will be useful in calculating a units stats against various types
*/


/*
TALENT COSTS
------------
Stores the item costs associated with leveling up talents for cats.
*/

/*
USER CAT TALENTS
----------------
Stores the talent levels for each cat owned by a user.
*/
