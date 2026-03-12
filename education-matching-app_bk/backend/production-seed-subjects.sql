-- Production Seed: Subject Categories, Subjects, and Subject Groups
-- Run this SQL in the production database via the Database pane

-- Clear existing data (optional - uncomment if needed)
-- DELETE FROM subject_groups;
-- DELETE FROM subjects;
-- DELETE FROM subject_categories;

-- Insert Subject Categories
INSERT INTO subject_categories (id, name, sort_order, is_active, created_at, updated_at) VALUES
('7c229628-4c0c-478b-afb8-694b219ba974', '学習教科', 1, true, NOW(), NOW()),
('9c81473a-6a12-42f9-a96d-380e346de002', 'ビジネススキル', 2, true, NOW(), NOW()),
('03eeffcb-3869-4225-8bbb-c82e1f63edc5', 'プログラミング・IT', 3, true, NOW(), NOW()),
('ea94b204-f147-44eb-b861-801ecaadf6b0', '音楽・クリエイティブ', 4, true, NOW(), NOW()),
('6e029fb2-021b-4c3c-a1e2-7398b45d0e85', '資格対策', 5, true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert Subjects
INSERT INTO subjects (id, category_id, name, is_popular, target_elementary, target_junior_high, target_high_school, target_university_adult, sort_order, is_active, created_at, updated_at) VALUES
-- 学習教科
('695f930a-b525-4972-9226-56903dfbe669', '7c229628-4c0c-478b-afb8-694b219ba974', '英語', true, true, true, true, true, 0, true, NOW(), NOW()),
('2648a917-e636-4a97-b43d-f58990d5f1d3', '7c229628-4c0c-478b-afb8-694b219ba974', '国語', true, true, true, true, false, 1, true, NOW(), NOW()),
('6bad5005-bd46-454d-b44d-53da2dec9a92', '7c229628-4c0c-478b-afb8-694b219ba974', '数学', true, true, true, true, true, 2, true, NOW(), NOW()),
('64252f8f-8775-4d9d-a1cc-dc34b502deae', '7c229628-4c0c-478b-afb8-694b219ba974', '理科', true, true, true, true, false, 3, true, NOW(), NOW()),
('7671871b-17e9-4b2d-85dc-09049c555771', '7c229628-4c0c-478b-afb8-694b219ba974', '社会', true, true, true, true, false, 4, true, NOW(), NOW()),
-- ビジネススキル
('52f38ec1-8e0a-4e31-b4fc-50eb556c4862', '9c81473a-6a12-42f9-a96d-380e346de002', '経理', true, false, false, false, true, 0, true, NOW(), NOW()),
('99287e88-6256-4a56-925f-7aa25724627d', '9c81473a-6a12-42f9-a96d-380e346de002', 'Webマーケティング', true, false, false, false, true, 1, true, NOW(), NOW()),
('8b421c62-3896-4306-8c18-127e7c40260b', '9c81473a-6a12-42f9-a96d-380e346de002', '投資', false, false, false, false, true, 2, true, NOW(), NOW()),
('7f74e536-b128-44b1-8b47-1c0c8a4f96bb', '9c81473a-6a12-42f9-a96d-380e346de002', '一般教養', false, false, false, false, true, 3, true, NOW(), NOW()),
-- プログラミング・IT
('45b216c4-20a5-4c2a-b8b6-4ae5cb48071a', '03eeffcb-3869-4225-8bbb-c82e1f63edc5', '情報処理', true, false, false, true, true, 0, true, NOW(), NOW()),
('04457aa7-512d-4498-81b7-1645fa4e9034', '03eeffcb-3869-4225-8bbb-c82e1f63edc5', 'プログラミング言語', true, false, true, true, true, 1, true, NOW(), NOW()),
('2ab3743b-2c8f-4595-84d9-02575b076c66', '03eeffcb-3869-4225-8bbb-c82e1f63edc5', 'ゲーム理論', false, false, false, true, true, 2, true, NOW(), NOW()),
-- 音楽・クリエイティブ
('05ced19a-633c-4fb3-a698-8b002f7caf23', 'ea94b204-f147-44eb-b861-801ecaadf6b0', '動画編集', true, false, true, true, true, 0, true, NOW(), NOW()),
('a6890086-de3e-4d88-a7ee-62c0b59e2ba5', 'ea94b204-f147-44eb-b861-801ecaadf6b0', '音楽理論', false, true, true, true, true, 1, true, NOW(), NOW()),
-- 資格対策
('d57e69b3-1921-4bc9-98a9-f0b26f0542a8', '6e029fb2-021b-4c3c-a1e2-7398b45d0e85', '英検', true, true, true, true, true, 0, true, NOW(), NOW()),
('468f9371-9baf-41c0-98fa-68b90ab94efa', '6e029fb2-021b-4c3c-a1e2-7398b45d0e85', '簿記', true, false, false, true, true, 1, true, NOW(), NOW()),
('7811d536-18e4-451b-91c6-e36839ba538d', '6e029fb2-021b-4c3c-a1e2-7398b45d0e85', '情報処理技術者試験', false, false, false, true, true, 2, true, NOW(), NOW()),
('70261d11-a47f-41a8-9979-a531634c2e71', '6e029fb2-021b-4c3c-a1e2-7398b45d0e85', 'その他', false, true, true, true, true, 3, true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert Subject Groups
INSERT INTO subject_groups (id, subject_id, name, sort_order, is_active, created_at, updated_at) VALUES
-- 英語
('c67d56dc-20d9-4738-9395-8323b0118dd3', '695f930a-b525-4972-9226-56903dfbe669', '文法', 0, true, NOW(), NOW()),
('8826f2b6-1377-4876-a3ae-efa57e8a4b79', '695f930a-b525-4972-9226-56903dfbe669', '読解', 1, true, NOW(), NOW()),
('99734c9e-eccf-4aea-8978-1ec5ae6c5652', '695f930a-b525-4972-9226-56903dfbe669', 'リスニング', 2, true, NOW(), NOW()),
('5217d6db-c648-431c-94ad-dfc0d21225c1', '695f930a-b525-4972-9226-56903dfbe669', 'スピーキング', 3, true, NOW(), NOW()),
-- 国語
('1c782307-d2d3-4d39-922d-e0899bde8d51', '2648a917-e636-4a97-b43d-f58990d5f1d3', '現代文', 0, true, NOW(), NOW()),
('bb2834a7-9f1b-496b-ac5a-f2cf9990516d', '2648a917-e636-4a97-b43d-f58990d5f1d3', '古文', 1, true, NOW(), NOW()),
('e6dc3568-3a29-4dc9-b178-6871bde69e79', '2648a917-e636-4a97-b43d-f58990d5f1d3', '漢文', 2, true, NOW(), NOW()),
('68ebfa97-419c-4137-81ca-13ad0ed4a4aa', '2648a917-e636-4a97-b43d-f58990d5f1d3', '作文', 3, true, NOW(), NOW()),
-- 数学
('bd40a0d9-4f40-402f-b9a7-3f9858c780df', '6bad5005-bd46-454d-b44d-53da2dec9a92', '計算', 0, true, NOW(), NOW()),
('6c155003-2094-47ee-9335-476e0a1b1939', '6bad5005-bd46-454d-b44d-53da2dec9a92', '代数', 1, true, NOW(), NOW()),
('5a5b4fa9-c08c-4354-a39e-4df3d7243609', '6bad5005-bd46-454d-b44d-53da2dec9a92', '幾何', 2, true, NOW(), NOW()),
('7dfe106d-a8d3-47dd-aa21-1a02f371a6a7', '6bad5005-bd46-454d-b44d-53da2dec9a92', '統計', 3, true, NOW(), NOW()),
-- 理科
('218297b9-8691-406a-9c3f-0861cec6fd1e', '64252f8f-8775-4d9d-a1cc-dc34b502deae', '物理', 0, true, NOW(), NOW()),
('90bd5a4f-8e43-4a22-864a-573a026e8c78', '64252f8f-8775-4d9d-a1cc-dc34b502deae', '化学', 1, true, NOW(), NOW()),
('755197cd-b9ef-4238-8097-d115fd578db9', '64252f8f-8775-4d9d-a1cc-dc34b502deae', '生物', 2, true, NOW(), NOW()),
('4095dc96-4cd6-45f8-bd2d-570b5306f5b3', '64252f8f-8775-4d9d-a1cc-dc34b502deae', '地学', 3, true, NOW(), NOW()),
-- 社会
('b43913de-a2e5-4473-90ad-6cadd930f72a', '7671871b-17e9-4b2d-85dc-09049c555771', '地理', 0, true, NOW(), NOW()),
('b26fa285-7697-4f89-90a2-fa4e85005f06', '7671871b-17e9-4b2d-85dc-09049c555771', '歴史', 1, true, NOW(), NOW()),
('6996e523-deb9-4e6d-a3a1-bf4d35f7b591', '7671871b-17e9-4b2d-85dc-09049c555771', '公民', 2, true, NOW(), NOW()),
('07333606-4ee1-4ba1-b89d-4f7677042ffb', '7671871b-17e9-4b2d-85dc-09049c555771', '現代社会', 3, true, NOW(), NOW()),
-- 経理
('1002d0c4-4c29-4bad-8d7c-3c32556af992', '52f38ec1-8e0a-4e31-b4fc-50eb556c4862', '簿記', 0, true, NOW(), NOW()),
('0f3a2ba8-1405-4c5e-af33-7f15e00762a0', '52f38ec1-8e0a-4e31-b4fc-50eb556c4862', '会計', 1, true, NOW(), NOW()),
('1327b0a1-0d38-4561-9244-bfbdd284c7c7', '52f38ec1-8e0a-4e31-b4fc-50eb556c4862', '財務諸表の基礎', 2, true, NOW(), NOW()),
-- Webマーケティング
('2a4bbcc4-6185-4805-914e-83575b062511', '99287e88-6256-4a56-925f-7aa25724627d', 'SEO', 0, true, NOW(), NOW()),
('1859efa3-ed54-4f4e-8a34-b5c11bd80c3e', '99287e88-6256-4a56-925f-7aa25724627d', 'SNS運用', 1, true, NOW(), NOW()),
('f2c428c3-b68d-4231-820e-3aa910d60772', '99287e88-6256-4a56-925f-7aa25724627d', '広告運用', 2, true, NOW(), NOW()),
-- 投資
('fe380ae0-9ebe-4d74-a794-18c9e3df3075', '8b421c62-3896-4306-8c18-127e7c40260b', '株式', 0, true, NOW(), NOW()),
('01d5f514-720b-4e9e-a207-a1c69af8080d', '8b421c62-3896-4306-8c18-127e7c40260b', '投資信託', 1, true, NOW(), NOW()),
('514585eb-c2ad-438a-86b1-e70ce2972e1a', '8b421c62-3896-4306-8c18-127e7c40260b', '資産運用の基礎知識', 2, true, NOW(), NOW()),
-- 一般教養
('09c847ea-ed05-46d7-b89b-dabb16f94b11', '7f74e536-b128-44b1-8b47-1c0c8a4f96bb', 'ビジネスマナー', 0, true, NOW(), NOW()),
('6dff2632-4db3-444d-a5b3-d9d524721c6c', '7f74e536-b128-44b1-8b47-1c0c8a4f96bb', '経済', 1, true, NOW(), NOW()),
('e26fa2d7-212f-449b-b024-f5ea6589f78b', '7f74e536-b128-44b1-8b47-1c0c8a4f96bb', '法律の基礎', 2, true, NOW(), NOW()),
-- 情報処理
('c7719bfd-9a9a-4876-ab97-1916ef96ceb7', '45b216c4-20a5-4c2a-b8b6-4ae5cb48071a', 'アルゴリズム', 0, true, NOW(), NOW()),
('69c460a8-ad06-400b-9555-bed2cbf62d6e', '45b216c4-20a5-4c2a-b8b6-4ae5cb48071a', 'データ構造', 1, true, NOW(), NOW()),
('a737325e-ad7d-456f-8742-16ff1c5dabad', '45b216c4-20a5-4c2a-b8b6-4ae5cb48071a', 'コンピュータサイエンスの基礎', 2, true, NOW(), NOW()),
-- プログラミング言語
('5927bac8-3f0f-424d-b9fd-4aa787c6f8e9', '04457aa7-512d-4498-81b7-1645fa4e9034', 'Python', 0, true, NOW(), NOW()),
('71a7dbba-06d6-4355-899b-b9b9318e5e0d', '04457aa7-512d-4498-81b7-1645fa4e9034', 'JavaScript', 1, true, NOW(), NOW()),
('c315d837-2747-4bf0-aa30-ce20ff341572', '04457aa7-512d-4498-81b7-1645fa4e9034', 'Java', 2, true, NOW(), NOW()),
('20f8d7d4-713b-4368-b970-d5637c0ca8ff', '04457aa7-512d-4498-81b7-1645fa4e9034', 'C++など', 3, true, NOW(), NOW()),
-- ゲーム理論
('18de967f-e311-45cc-ab91-b4fbaa15c121', '2ab3743b-2c8f-4595-84d9-02575b076c66', 'ゲーム開発の基礎', 0, true, NOW(), NOW()),
('c5ccd2ab-769d-4305-b6e9-53a2de6024cd', '2ab3743b-2c8f-4595-84d9-02575b076c66', 'Unity', 1, true, NOW(), NOW()),
('2d98f832-501a-468d-a0a4-5b3b679a8ac4', '2ab3743b-2c8f-4595-84d9-02575b076c66', 'Unreal Engine', 2, true, NOW(), NOW()),
-- 動画編集
('ee9b0108-9390-4d6b-8914-10030d4db7c1', '05ced19a-633c-4fb3-a698-8b002f7caf23', 'Premiere Pro', 0, true, NOW(), NOW()),
('d438f808-705b-4afe-9ef6-20e0558f5a88', '05ced19a-633c-4fb3-a698-8b002f7caf23', 'Final Cut Pro', 1, true, NOW(), NOW()),
('09d0192d-8a38-4f51-83ba-fadb80181a48', '05ced19a-633c-4fb3-a698-8b002f7caf23', 'After Effects', 2, true, NOW(), NOW()),
-- 音楽理論
('11bf1c4e-18fc-46d4-9d51-f2f3cdfc11ba', 'a6890086-de3e-4d88-a7ee-62c0b59e2ba5', '楽典', 0, true, NOW(), NOW()),
('cefd19b5-6476-4b05-af84-b93c17abd849', 'a6890086-de3e-4d88-a7ee-62c0b59e2ba5', '和声', 1, true, NOW(), NOW()),
('3cfc397b-fdaa-4ec5-a0c2-11f4d4217c55', 'a6890086-de3e-4d88-a7ee-62c0b59e2ba5', '作曲', 2, true, NOW(), NOW()),
('4bcac63a-d948-4fe8-b476-960b66c3c68e', 'a6890086-de3e-4d88-a7ee-62c0b59e2ba5', '編曲の基礎', 3, true, NOW(), NOW()),
-- 英検
('fc4733b8-4ba5-4a08-8eea-0ccf5087dbfb', 'd57e69b3-1921-4bc9-98a9-f0b26f0542a8', '5級', 0, true, NOW(), NOW()),
('55951126-e78a-4b2e-9bd3-05ec508fe085', 'd57e69b3-1921-4bc9-98a9-f0b26f0542a8', '4級', 1, true, NOW(), NOW()),
('21f2e511-e373-45d2-8a73-0740571312a5', 'd57e69b3-1921-4bc9-98a9-f0b26f0542a8', '3級', 2, true, NOW(), NOW()),
('edcaf23b-4b28-4dab-88c3-0c0c5e4763d8', 'd57e69b3-1921-4bc9-98a9-f0b26f0542a8', '準2級', 3, true, NOW(), NOW()),
('055adc60-3b48-4d22-8cbd-f91312dfb5aa', 'd57e69b3-1921-4bc9-98a9-f0b26f0542a8', '2級', 4, true, NOW(), NOW()),
('b880a73c-87f1-4e15-b2e2-be159a869e07', 'd57e69b3-1921-4bc9-98a9-f0b26f0542a8', '準1級', 5, true, NOW(), NOW()),
('2715613f-8d11-4c49-a8a9-32418c0dbfe4', 'd57e69b3-1921-4bc9-98a9-f0b26f0542a8', '1級', 6, true, NOW(), NOW()),
-- 簿記
('e7e6b8a1-7436-4128-a05c-acaf636ec670', '468f9371-9baf-41c0-98fa-68b90ab94efa', '日商簿記3級', 0, true, NOW(), NOW()),
('9dc64106-b30d-4665-91b6-01da3c6a6343', '468f9371-9baf-41c0-98fa-68b90ab94efa', '日商簿記2級', 1, true, NOW(), NOW()),
-- 情報処理技術者試験
('d10e053d-f6e4-4b2b-ad69-b01a14961025', '7811d536-18e4-451b-91c6-e36839ba538d', '基本情報', 0, true, NOW(), NOW()),
('73ff8650-be6c-4fe5-a2fe-0daba5bb0e3f', '7811d536-18e4-451b-91c6-e36839ba538d', '応用情報', 1, true, NOW(), NOW()),
-- その他
('53e79092-1de7-4618-8ae8-bf710706e33c', '70261d11-a47f-41a8-9979-a531634c2e71', 'TOEIC', 0, true, NOW(), NOW()),
('ad21ab53-f895-4319-abb6-9692880ae76c', '70261d11-a47f-41a8-9979-a531634c2e71', '漢検', 1, true, NOW(), NOW()),
('640bea19-4513-4052-962e-794f36be02a2', '70261d11-a47f-41a8-9979-a531634c2e71', '数検など', 2, true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
