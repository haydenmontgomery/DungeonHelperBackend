INSERT INTO users (id, username, password, first_name, last_name, email, is_admin)
VALUES (1,
        'testuser',
        '$2b$12$.IDpJyzw8Jyo7rrBUBY8C.7a1ML8RVhZ62ZEMWRfrrWe.iYWXI59e',
        'Test',
        'User',
        'strongrad@strongrad.com',
        FALSE),
        (2,
        'testDM',
        '$2b$12$.IDpJyzw8Jyo7rrBUBY8C.7a1ML8RVhZ62ZEMWRfrrWe.iYWXI59e',
        'Test',
        'CampaignDM',
        'strongrad@strongrad.com',
        FALSE),
       (3,
        'testadmin',
        '$2b$12$.IDpJyzw8Jyo7rrBUBY8C.7a1ML8RVhZ62ZEMWRfrrWe.iYWXI59e',
        'Test',
        'Admin!',
        'strongrad@strongrad.com',
        TRUE);

INSERT INTO characters (id, name, class_name, bio, age, height, level, inventory, gold, hp, profile_url, user_id)
VALUES (1,
        'testcharacter',
        'testclassname',
        'testbio',
        99999,
        '6 ft 2 in',
        20,
        ARRAY['acid-vial', 'scimitar-of-speed', 'arrow'],
        99999,
        99999,
        '/static/images/default_profile.png',
        1),
        (2,
        'testcharacter2',
        'testclassname2',
        'testbio2',
        99999,
        '6 ft 2 in',
        1,
        ARRAY['acid-vial', 'scimitar-of-speed', 'arrow'],
        10,
        10,
        '/static/images/default_profile.png',
        1);

INSERT INTO campaigns (id, title, description, start_date, max_players, public_view)
VALUES (1,
        'testtitle',
        'testdescription',
        '1974-1-1',
        2,
        TRUE),
        (2,
        'testtitle2',
        'testdescription2',
        '2024-12-4',
        8,
        TRUE);

INSERT INTO campaign_admins (campaign_id, user_id)
VALUES (1, 
        2),
        (1,
        1),
        (2,
        2);

INSERT INTO campaign_users (campaign_id, character_id)
VALUES (2,
        1),
        (2,
        2);

INSERT INTO sessions (id, name, password, description, expires_at, campaign_id, dungeon_master_id)
VALUES (1,
        'testsession',
        'testpassword',
        'testdescription',
        CURRENT_TIMESTAMP + INTERVAL '4 hours',
        2,
        2);

INSERT INTO session_players (session_id, character_id)
VALUES (1,
        1),
        (1,
        2);