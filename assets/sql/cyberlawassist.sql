-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 18, 2026 at 06:36 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `cyberlawassist`
--

-- --------------------------------------------------------

--
-- Table structure for table `case_records`
--

CREATE TABLE `case_records` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `reference` varchar(32) DEFAULT NULL COMMENT 'Assigned after insert within the same transaction',
  `visitor_name` varchar(120) DEFAULT NULL COMMENT 'NULL only for a retained incomplete legacy record',
  `contact_number` varchar(50) DEFAULT NULL,
  `concern_type` enum('online_harassment','account_access','online_fraud','identity_theft','other') NOT NULL,
  `visit_date` date DEFAULT NULL COMMENT 'Required for new intake; unknown legacy dates stay NULL',
  `assigned_staff` varchar(120) DEFAULT NULL,
  `status` enum('for_review','in_progress','referred','completed') NOT NULL DEFAULT 'for_review',
  `factual_notes` text DEFAULT NULL,
  `is_legacy` tinyint(1) NOT NULL DEFAULT 0,
  `created_by` char(32) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `request_key` varchar(80) CHARACTER SET ascii COLLATE ascii_bin DEFAULT NULL,
  `revision` int(10) UNSIGNED NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `chat_conversations`
--

CREATE TABLE `chat_conversations` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` char(32) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `title` varchar(120) NOT NULL,
  `is_pinned` tinyint(1) NOT NULL DEFAULT 0,
  `last_topic` varchar(80) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `chat_conversations`
--

INSERT INTO `chat_conversations` (`id`, `user_id`, `title`, `is_pinned`, `last_topic`, `created_at`, `updated_at`) VALUES
(1, '8470f28f707f15f8e3de5df1482d6797', 'I received a suspicious email asking for my p', 0, 'phishing_email', '2026-10-18 08:11:07', '2026-10-18 08:11:08');

-- --------------------------------------------------------

--
-- Table structure for table `chat_messages`
--

CREATE TABLE `chat_messages` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `conversation_id` bigint(20) UNSIGNED NOT NULL,
  `request_key` varchar(80) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `sender` enum('user','assistant') NOT NULL,
  `body` text NOT NULL,
  `language` enum('auto','en','tl','taglish') NOT NULL DEFAULT 'auto',
  `delivery_status` enum('pending','sent','failed') NOT NULL DEFAULT 'pending',
  `response_meta` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Assistant topic, intent_id, kind, match_score, sources, suggestions' CHECK (json_valid(`response_meta`)),
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `chat_messages`
--

INSERT INTO `chat_messages` (`id`, `conversation_id`, `request_key`, `sender`, `body`, `language`, `delivery_status`, `response_meta`, `created_at`, `updated_at`) VALUES
(1, 1, 'mvdjqeqk-ri4fj73726m', 'user', 'I received a suspicious email asking for my password', 'auto', 'sent', NULL, '2026-10-18 08:11:07', '2026-10-18 08:11:08'),
(2, 1, 'mvdjqeqk-ri4fj73726m', 'assistant', 'Phishing emails try to obtain information or make you open unsafe links or attachments.\n\nFirst: Do not reply with account details; verify the request through the organization\'s official website or known contact.', 'en', 'sent', '{\"topic\":\"phishing_email\",\"intent_id\":\"phishing_email.first_steps\",\"match_score\":0.6479,\"kind\":\"matched\",\"sources\":[{\"id\":\"ra10175\",\"title\":\"Republic Act No. 10175 — statutory text\",\"url\":\"https:\\/\\/lawphil.net\\/statutes\\/repacts\\/ra2012\\/ra_10175_2012.html\",\"checked\":\"2026-10-18\"},{\"id\":\"pao\",\"title\":\"Public Attorney\'s Office — services and eligibility\",\"url\":\"https:\\/\\/pao.gov.ph\\/services-2\\/\",\"checked\":\"2026-10-18\"},{\"id\":\"cybersecurity\",\"title\":\"CISA — phishing, passwords, and multifactor authentication\",\"url\":\"https:\\/\\/www.cisa.gov\\/secure-our-world\",\"checked\":\"2026-10-18\"}],\"suggestions\":[\"I received a suspicious email asking for my account details. What should I do first?\",\"I received a suspicious email asking for my account details. What evidence should I preserve?\",\"I received a suspicious email asking for my account details. Where can I report this concern?\"]}', '2026-10-18 08:11:08', '2026-10-18 08:11:08');

-- --------------------------------------------------------

--
-- Table structure for table `checklist_items`
--

CREATE TABLE `checklist_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` char(32) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `label` varchar(500) NOT NULL,
  `is_completed` tinyint(1) NOT NULL DEFAULT 0,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `request_key` varchar(80) CHARACTER SET ascii COLLATE ascii_bin DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `checklist_items`
--

INSERT INTO `checklist_items` (`id`, `user_id`, `label`, `is_completed`, `sort_order`, `created_at`, `updated_at`, `request_key`) VALUES
(1, 'a30d1b82260f1133cb5663e8894d6045', 'Save relevant messages or posts', 0, 0, '2026-10-18 07:37:58', '2026-10-18 07:37:58', NULL),
(2, 'a30d1b82260f1133cb5663e8894d6045', 'Record dates, times, and account names', 0, 1, '2026-10-18 07:37:58', '2026-10-18 07:37:58', NULL),
(3, 'a30d1b82260f1133cb5663e8894d6045', 'Secure affected accounts', 0, 2, '2026-10-18 07:37:58', '2026-10-18 07:37:58', NULL),
(4, 'a30d1b82260f1133cb5663e8894d6045', 'Write questions for the office', 0, 3, '2026-10-18 07:37:58', '2026-10-18 07:37:58', NULL),
(5, '8470f28f707f15f8e3de5df1482d6797', 'Save relevant messages or posts', 0, 0, '2026-10-18 08:10:50', '2026-10-18 08:10:50', NULL),
(6, '8470f28f707f15f8e3de5df1482d6797', 'Record dates, times, and account names', 0, 1, '2026-10-18 08:10:50', '2026-10-18 08:10:50', NULL),
(7, '8470f28f707f15f8e3de5df1482d6797', 'Secure affected accounts', 0, 2, '2026-10-18 08:10:50', '2026-10-18 08:10:50', NULL),
(8, '8470f28f707f15f8e3de5df1482d6797', 'Write questions for the office', 0, 3, '2026-10-18 08:10:50', '2026-10-18 08:10:50', NULL),
(9, 'f58f03e648e0b71bf4e78f19643b07d5', 'Save relevant messages or posts', 0, 0, '2026-10-18 08:12:34', '2026-10-18 08:12:34', NULL),
(10, 'f58f03e648e0b71bf4e78f19643b07d5', 'Record dates, times, and account names', 0, 1, '2026-10-18 08:12:34', '2026-10-18 08:12:34', NULL),
(11, 'f58f03e648e0b71bf4e78f19643b07d5', 'Secure affected accounts', 0, 2, '2026-10-18 08:12:34', '2026-10-18 08:12:34', NULL),
(12, 'f58f03e648e0b71bf4e78f19643b07d5', 'Write questions for the office', 0, 3, '2026-10-18 08:12:34', '2026-10-18 08:12:34', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `law_topics`
--

CREATE TABLE `law_topics` (
  `id` int(10) UNSIGNED NOT NULL,
  `slug` varchar(80) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `law_reference` varchar(100) NOT NULL DEFAULT 'RA 10175',
  `section_reference` varchar(160) DEFAULT NULL,
  `source_urls` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`source_urls`)),
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_published` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `law_topics`
--

INSERT INTO `law_topics` (`id`, `slug`, `law_reference`, `section_reference`, `source_urls`, `sort_order`, `is_published`, `created_at`, `updated_at`) VALUES
(1, 'overview', 'RA 10175', NULL, '[\"https:\\/\\/lawphil.net\\/statutes\\/repacts\\/ra2012\\/ra_10175_2012.html\",\"https:\\/\\/elibrary.judiciary.gov.ph\\/thebookshelf\\/showdocs\\/1\\/56650\"]', 0, 1, '2026-10-18 06:56:27', '2026-10-18 06:56:27'),
(2, 'illegal-access', 'RA 10175', NULL, '[\"https:\\/\\/lawphil.net\\/statutes\\/repacts\\/ra2012\\/ra_10175_2012.html\"]', 1, 1, '2026-10-18 06:56:27', '2026-10-18 06:56:27'),
(3, 'computer-related-fraud', 'RA 10175', NULL, '[\"https:\\/\\/lawphil.net\\/statutes\\/repacts\\/ra2012\\/ra_10175_2012.html\"]', 2, 1, '2026-10-18 06:56:27', '2026-10-18 06:56:27'),
(4, 'computer-related-identity-theft', 'RA 10175', NULL, '[\"https:\\/\\/lawphil.net\\/statutes\\/repacts\\/ra2012\\/ra_10175_2012.html\"]', 3, 1, '2026-10-18 06:56:27', '2026-10-18 06:56:27'),
(5, 'cyber-libel', 'RA 10175', NULL, '[\"https:\\/\\/lawphil.net\\/statutes\\/repacts\\/ra2012\\/ra_10175_2012.html\",\"https:\\/\\/elibrary.judiciary.gov.ph\\/thebookshelf\\/showdocs\\/1\\/56650\"]', 4, 1, '2026-10-18 06:56:27', '2026-10-18 06:56:27'),
(6, 'online-harassment', 'RA 10175', NULL, '[\"https:\\/\\/lawphil.net\\/statutes\\/repacts\\/ra2012\\/ra_10175_2012.html\",\"https:\\/\\/pao.gov.ph\\/services-2\\/\",\"https:\\/\\/www.cisa.gov\\/secure-our-world\"]', 5, 1, '2026-10-18 06:56:27', '2026-10-18 06:56:27');

-- --------------------------------------------------------

--
-- Table structure for table `law_translations`
--

CREATE TABLE `law_translations` (
  `law_topic_id` int(10) UNSIGNED NOT NULL,
  `language` enum('en','tl','taglish') NOT NULL,
  `title` varchar(200) NOT NULL,
  `summary` text NOT NULL,
  `legal_text` longtext DEFAULT NULL,
  `penalties` text DEFAULT NULL,
  `fines` text DEFAULT NULL,
  `evidence_guidance` text DEFAULT NULL,
  `next_steps` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `law_translations`
--

INSERT INTO `law_translations` (`law_topic_id`, `language`, `title`, `summary`, `legal_text`, `penalties`, `fines`, `evidence_guidance`, `next_steps`) VALUES
(1, 'en', 'What is Republic Act No. 10175?', 'RA 10175 is the Cybercrime Prevention Act of 2012. It addresses specified offenses involving computer systems and data, computer-related fraud and identity theft, and certain content-related acts. Its application must take account of court rulings and other applicable laws. Describe your concern if you want help organizing possible next steps.', NULL, NULL, NULL, NULL, NULL),
(1, 'tl', 'Ano ang Republic Act No. 10175?', 'Ang RA 10175 ay ang Cybercrime Prevention Act of 2012. Saklaw nito ang mga tinukoy na paglabag sa computer at datos, panloloko at pagnanakaw ng pagkakakilanlan gamit ang computer, at ilang gawaing may kaugnayan sa nilalaman. Dapat isaalang-alang ang mga pasya ng hukuman at iba pang batas sa paglalapat nito.', NULL, NULL, NULL, NULL, NULL),
(1, 'taglish', 'Ano ang RA 10175 o Cybercrime Prevention Act?', 'Ang RA 10175 ay Cybercrime Prevention Act of 2012. Saklaw nito ang specified computer at data offenses, computer-related fraud at identity theft, at certain content-related acts. Kailangan ding i-consider ang court rulings at other applicable laws. I-describe ang concern mo para sa general next-step guidance.', NULL, NULL, NULL, NULL, NULL),
(2, 'en', 'What does illegal access mean in RA 10175?', 'Section 4(a)(1) addresses accessing all or part of a computer system without right. The exact authority, facts, and legal context matter. If your own account is affected, preserve alerts and use official recovery tools; do not enter another person\'s account to investigate.', NULL, NULL, NULL, NULL, NULL),
(2, 'tl', 'Ano ang ilegal na pag-access sa RA 10175?', 'Tinutukoy ng Seksyon 4(a)(1) ang pagpasok sa kabuuan o bahagi ng computer system nang walang karapatan. Mahalaga ang pahintulot, pangyayari, at konteksto ng batas. Kung sarili mong account ang apektado, itabi ang mga abiso at gamitin ang opisyal na pagbawi; huwag pumasok sa account ng iba.', NULL, NULL, NULL, NULL, NULL),
(2, 'taglish', 'Ano ang illegal access under RA 10175?', 'Section 4(a)(1) covers access sa all o part ng computer system without right. Mahalaga ang authority, facts, at legal context. Kung account mo ang affected, preserve alerts at use official recovery; huwag pumasok sa account ng iba para mag-investigate.', NULL, NULL, NULL, NULL, NULL),
(3, 'en', 'What is computer-related fraud?', 'RA 10175 includes a computer-related fraud provision involving specified unauthorized data or system acts with fraudulent intent. Not every failed online transaction automatically satisfies it. Preserve the transaction and communications and ask a lawyer or investigator to assess the facts.', NULL, NULL, NULL, NULL, NULL),
(3, 'tl', 'Ano ang panloloko gamit ang computer?', 'May probisyon ang RA 10175 sa computer-related fraud na may tinukoy na hindi awtorisadong gawain sa datos o sistema at layuning manlinlang. Hindi lahat ng hindi natupad na transaksyon online ay awtomatikong saklaw. Itabi ang transaksyon at usapan at ipasuri ang mga pangyayari.', NULL, NULL, NULL, NULL, NULL),
(3, 'taglish', 'Ano ang computer-related fraud?', 'May computer-related fraud provision ang RA 10175 para sa specified unauthorized data o system acts with fraudulent intent. Hindi automatic na pasok ang bawat failed online transaction. Preserve transaction records at chats para ma-assess ng lawyer o investigator.', NULL, NULL, NULL, NULL, NULL),
(4, 'en', 'What is computer-related identity theft?', 'RA 10175 addresses specified intentional uses or possession of identifying information without right under its identity-theft provision. Exact facts and legal elements still need assessment. Record how your identity was used and contact affected services through verified channels.', NULL, NULL, NULL, NULL, NULL),
(4, 'tl', 'Ano ang pagnanakaw ng pagkakakilanlan gamit ang computer?', 'Tinutukoy ng probisyon ng RA 10175 sa identity theft ang ilang sinasadyang paggamit o paghawak ng impormasyong nagpapakilala nang walang karapatan. Kailangang suriin ang tiyak na pangyayari at elemento. Itala kung paano ginamit ang iyong pagkakakilanlan at kausapin ang mga apektadong serbisyo.', NULL, NULL, NULL, NULL, NULL),
(4, 'taglish', 'Ano ang computer-related identity theft sa batas?', 'May specified intentional uses o possession ng identifying information without right sa identity-theft provision ng RA 10175. Kailangan pa rin ng factual at legal assessment. Record kung paano ginamit ang identity mo at contact affected services through verified channels.', NULL, NULL, NULL, NULL, NULL),
(5, 'en', 'Is every offensive social media post cyberlibel?', 'No. Whether a post is actionable as cyberlibel requires legal assessment of the exact publication and applicable law and court rulings. Disini addresses the original author\'s liability and distinguishes merely receiving or reacting to a post. Preserve the full context and consult a lawyer.', NULL, NULL, NULL, NULL, NULL),
(5, 'tl', 'Lahat ba ng nakasasakit na post ay cyberlibel?', 'Hindi. Kailangan ng legal na pagsusuri sa eksaktong post, batas, at mga pasya ng hukuman. Tinalakay sa Disini ang orihinal na sumulat at ibinukod ang basta pagtanggap o reaksyon sa post. Itabi ang buong konteksto at kumonsulta sa abogado.', NULL, NULL, NULL, NULL, NULL),
(5, 'taglish', 'Automatic cyberlibel ba ang offensive post?', 'Hindi. Legal assessment ng exact post, law, at court rulings ang kailangan. Tinatalakay ng Disini ang original author\'s liability at inihihiwalay ang mere receipt o reaction. Preserve full context at consult a lawyer.', NULL, NULL, NULL, NULL, NULL),
(6, 'en', 'Someone repeatedly sends me abusive messages despite being asked to stop. What should I do first?', 'A pattern of abusive contact can be important when an office evaluates a harassment concern.\n\nFirst: Keep a record of repeated contact and use platform privacy or blocking tools once relevant evidence is preserved.', NULL, NULL, NULL, NULL, NULL),
(6, 'tl', 'Paulit-ulit akong pinapadalhan ng mapang-abusong mensahe kahit pinatigil ko na. Ano ang dapat kong unang gawin?', 'Mahalaga ang paulit-ulit na pakikipag-ugnayan sa pagsusuri ng suliranin sa panggigipit.\n\nUnang hakbang: Itala ang mga mensahe at gamitin ang pagkapribado o pagharang sa plataporma matapos maitabi ang ebidensya.', NULL, NULL, NULL, NULL, NULL),
(6, 'taglish', 'Paulit-ulit ang abusive messages kahit sinabi kong stop na. Ano ang first step na dapat kong gawin?', 'Important ang pattern ng repeated contact kapag ine-evaluate ang harassment concern.\n\nFirst step: Keep a record at gamitin ang privacy o blocking tools after ma-preserve ang evidence.', NULL, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `recipient_user_id` char(32) CHARACTER SET ascii COLLATE ascii_bin DEFAULT NULL COMMENT 'NULL means a broadcast to audience',
  `audience` enum('all','guest','user','admin') NOT NULL,
  `kind` enum('notification','alert') NOT NULL DEFAULT 'notification',
  `title_en` varchar(160) NOT NULL,
  `body_en` text NOT NULL,
  `title_tl` varchar(160) DEFAULT NULL,
  `body_tl` text DEFAULT NULL,
  `action_tab` varchar(40) DEFAULT NULL,
  `support_thread_id` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `recipient_user_id`, `audience`, `kind`, `title_en`, `body_en`, `title_tl`, `body_tl`, `action_tab`, `support_thread_id`, `created_at`) VALUES
(1, NULL, 'all', 'notification', 'Welcome to CyberLawAssist', 'Find general cyber-law information and office contact details.', 'Maligayang pagdating sa CyberLawAssist', 'Alamin ang pangkalahatang impormasyon sa cybercrime at ugnayan ng tanggapan.', 'about', NULL, '2026-10-18 06:56:27'),
(2, NULL, 'all', 'notification', 'RA 10175 guide available', 'Explore the Cybercrime Prevention Act overview in your Law tab.', 'May gabay tungkol sa RA 10175', 'Basahin ang buod ng Cybercrime Prevention Act sa pahina ng batas.', 'law', NULL, '2026-10-18 06:56:27'),
(3, NULL, 'user', 'alert', 'Keep your information safe', 'Avoid sharing passwords, OTPs, or unnecessary identity documents in chat.', 'Ingatan ang iyong impormasyon', 'Huwag magbigay ng password, OTP, o hindi kailangang dokumento sa chat.', 'chatbot', NULL, '2026-10-18 06:56:27'),
(4, NULL, 'admin', 'alert', 'Protect client information', 'Use only the details needed for office intake and support.', 'Ingatan ang impormasyon ng kliyente', 'Gamitin lamang ang detalyeng kailangan sa pagtanggap at pagtulong ng tanggapan.', 'intake', NULL, '2026-10-18 06:56:27'),
(5, NULL, 'admin', 'notification', 'New support message', 'Open Live support to read the message.', 'Bagong mensahe sa tanggapan', 'Buksan ang Tulong online upang basahin ang mensahe.', 'support', 1, '2026-10-18 14:37:59'),
(6, '8470f28f707f15f8e3de5df1482d6797', 'user', 'notification', 'Office staff replied', 'Open Live support to read the message.', 'May sagot ang tanggapan', 'Buksan ang Tulong online upang basahin ang mensahe.', 'support', 1, '2026-10-18 14:38:23'),
(7, NULL, 'admin', 'notification', 'New support message', 'Open Live support to read the message.', 'Bagong mensahe sa tanggapan', 'Buksan ang Tulong online upang basahin ang mensahe.', 'support', 1, '2026-10-18 14:38:46'),
(8, '8470f28f707f15f8e3de5df1482d6797', 'user', 'notification', 'Office staff replied', 'Open Live support to read the message.', 'May sagot ang tanggapan', 'Buksan ang Tulong online upang basahin ang mensahe.', 'support', 1, '2026-10-18 14:38:53'),
(9, NULL, 'admin', 'notification', 'New support message', 'Open Live support to read the message.', 'Bagong mensahe sa tanggapan', 'Buksan ang Tulong online upang basahin ang mensahe.', 'support', 1, '2026-10-18 14:39:02');

-- --------------------------------------------------------

--
-- Table structure for table `notification_reads`
--

CREATE TABLE `notification_reads` (
  `notification_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` char(32) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `read_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `office_contacts`
--

CREATE TABLE `office_contacts` (
  `id` int(10) UNSIGNED NOT NULL,
  `slug` varchar(80) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `contact_type` enum('office','agency') NOT NULL,
  `name` varchar(200) NOT NULL,
  `address` text DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `website_url` varchar(1000) DEFAULT NULL,
  `source_url` varchar(1000) DEFAULT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `office_contacts`
--

INSERT INTO `office_contacts` (`id`, `slug`, `contact_type`, `name`, `address`, `phone`, `website_url`, `source_url`, `sort_order`, `is_active`, `updated_at`) VALUES
(1, 'muntinlupa-pao', 'office', 'Muntinlupa City District Office - Public Attorney\'s Office', 'Ground Floor, Municipal City Hall of Justice Building Right Wing, National Road, Tunasan, Muntinlupa, 1773 Metro Manila', '(02) 8862 2525', NULL, NULL, 0, 1, '2026-10-18 06:56:27'),
(2, 'pnp-acg', 'agency', 'Philippine National Police - Anti-Cybercrime Group', NULL, NULL, 'https://acg.pnp.gov.ph/', 'https://acg.pnp.gov.ph/', 1, 1, '2026-10-18 07:24:59'),
(3, 'nbi', 'agency', 'National Bureau of Investigation', NULL, NULL, 'https://nbi.gov.ph/contact/', 'https://nbi.gov.ph/contact/', 2, 1, '2026-10-18 07:24:59'),
(4, 'npc', 'agency', 'National Privacy Commission', NULL, NULL, 'https://privacy.gov.ph/file-a-complaint-2/', 'https://privacy.gov.ph/file-a-complaint-2/', 3, 1, '2026-10-18 07:24:59');

-- --------------------------------------------------------

--
-- Table structure for table `support_messages`
--

CREATE TABLE `support_messages` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `thread_id` bigint(20) UNSIGNED NOT NULL,
  `sender_user_id` char(32) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `sender_role` enum('user','admin') NOT NULL,
  `request_key` varchar(80) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `body` text NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `support_messages`
--

INSERT INTO `support_messages` (`id`, `thread_id`, `sender_user_id`, `sender_role`, `request_key`, `body`, `created_at`) VALUES
(1, 1, '8470f28f707f15f8e3de5df1482d6797', 'user', 'mvdxjx1x-h603alivn5n', 'hello', '2026-10-18 14:37:59'),
(2, 1, 'f58f03e648e0b71bf4e78f19643b07d5', 'admin', 'mvdxkflw-cym8v4zwx7', 'oh hi there, what can i help you?', '2026-10-18 14:38:23'),
(3, 1, '8470f28f707f15f8e3de5df1482d6797', 'user', 'mvdxkx8u-q23s93l7a7m', 'theres my number 09214040431', '2026-10-18 14:38:46'),
(4, 1, 'f58f03e648e0b71bf4e78f19643b07d5', 'admin', 'mvdxl2a7-exyjd7frxy', 'and', '2026-10-18 14:38:53'),
(5, 1, '8470f28f707f15f8e3de5df1482d6797', 'user', 'mvdxl9i8-er435nn9pqk', 'sike, thats my wrong number', '2026-10-18 14:39:02');

-- --------------------------------------------------------

--
-- Table structure for table `support_threads`
--

CREATE TABLE `support_threads` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` char(32) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `support_threads`
--

INSERT INTO `support_threads` (`id`, `user_id`, `created_at`, `updated_at`) VALUES
(1, '8470f28f707f15f8e3de5df1482d6797', '2026-10-18 14:37:59', '2026-10-18 14:39:02');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` char(32) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `name` varchar(120) NOT NULL,
  `email` varchar(254) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `login_failures` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `login_locked_until` datetime DEFAULT NULL,
  `role` enum('user','admin') NOT NULL DEFAULT 'user',
  `status` enum('active','disabled') NOT NULL DEFAULT 'active',
  `ui_language` enum('en','tl') NOT NULL DEFAULT 'en',
  `chat_language` enum('auto','en','tl','taglish') NOT NULL DEFAULT 'auto',
  `email_updates` tinyint(1) NOT NULL DEFAULT 1,
  `privacy_reminders` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `session_version` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `admin_number` varchar(40) CHARACTER SET ascii COLLATE ascii_bin DEFAULT NULL,
  `policy_version` varchar(20) DEFAULT NULL,
  `policy_accepted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `phone`, `password_hash`, `login_failures`, `login_locked_until`, `role`, `status`, `ui_language`, `chat_language`, `email_updates`, `privacy_reminders`, `created_at`, `updated_at`, `session_version`, `admin_number`, `policy_version`, `policy_accepted_at`) VALUES
('8470f28f707f15f8e3de5df1482d6797', 'Joanna', 'joanna@gmail.com', '09594983851', '$2y$10$SnHiIdtwqlkaF6pVsWyJD.NghIGFLDJ/3zndRwJ9xYTJSa/HW2ABK', 0, NULL, 'user', 'active', 'en', 'auto', 1, 1, '2026-10-18 08:10:50', '2026-10-18 08:10:50', 1, NULL, NULL, NULL),
('a30d1b82260f1133cb5663e8894d6045', 'Joshua Q. Malapote', 'joshuamalapote21@gmail.com', NULL, '$2y$10$RwOdFjGfCZN1I5LVdbCnauV.IHPqRLXrCqW.AvdHNpIAG9M5Dy7eG', 0, NULL, 'admin', 'active', 'en', 'auto', 1, 1, '2026-10-18 07:37:58', '2026-10-18 16:48:56', 1, 'ADM-0001', NULL, NULL),
('f58f03e648e0b71bf4e78f19643b07d5', 'Kath', 'kath@gmail.com', '09685883883', '$2y$10$UNZUedIt2bTKCA9Z.0TLy.iHISKOSJ3F3aDQShydIdVxCrp/35VkW', 0, NULL, 'admin', 'active', 'en', 'auto', 1, 1, '2026-10-18 08:12:34', '2026-10-18 16:48:56', 1, 'ADM-0002', NULL, NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `case_records`
--
ALTER TABLE `case_records`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_case_reference` (`reference`),
  ADD UNIQUE KEY `uq_case_request` (`created_by`,`request_key`),
  ADD KEY `ix_case_report_date_status` (`visit_date`,`status`),
  ADD KEY `ix_case_created_by` (`created_by`);

--
-- Indexes for table `chat_conversations`
--
ALTER TABLE `chat_conversations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ix_chat_owner_sort` (`user_id`,`is_pinned`,`updated_at`);

--
-- Indexes for table `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_chat_request_sender` (`conversation_id`,`request_key`,`sender`),
  ADD KEY `ix_chat_message_order` (`conversation_id`,`id`);

--
-- Indexes for table `checklist_items`
--
ALTER TABLE `checklist_items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_checklist_request` (`user_id`,`request_key`),
  ADD KEY `ix_checklist_owner_order` (`user_id`,`sort_order`,`id`);

--
-- Indexes for table `law_topics`
--
ALTER TABLE `law_topics`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_law_slug` (`slug`),
  ADD KEY `ix_law_public_order` (`is_published`,`sort_order`);

--
-- Indexes for table `law_translations`
--
ALTER TABLE `law_translations`
  ADD PRIMARY KEY (`law_topic_id`,`language`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ix_notification_recipient` (`recipient_user_id`,`kind`,`created_at`),
  ADD KEY `ix_notification_audience` (`audience`,`kind`,`created_at`),
  ADD KEY `ix_notification_support` (`support_thread_id`);

--
-- Indexes for table `notification_reads`
--
ALTER TABLE `notification_reads`
  ADD PRIMARY KEY (`notification_id`,`user_id`),
  ADD KEY `ix_notification_read_user` (`user_id`,`notification_id`);

--
-- Indexes for table `office_contacts`
--
ALTER TABLE `office_contacts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_office_slug` (`slug`),
  ADD KEY `ix_office_public_order` (`is_active`,`sort_order`);

--
-- Indexes for table `support_messages`
--
ALTER TABLE `support_messages`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_support_request` (`thread_id`,`sender_user_id`,`request_key`),
  ADD KEY `ix_support_message_order` (`thread_id`,`id`),
  ADD KEY `ix_support_sender` (`sender_user_id`);

--
-- Indexes for table `support_threads`
--
ALTER TABLE `support_threads`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_support_user` (`user_id`),
  ADD KEY `ix_support_recent` (`updated_at`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_users_email` (`email`),
  ADD UNIQUE KEY `uq_users_admin_number` (`admin_number`),
  ADD KEY `ix_users_role_status` (`role`,`status`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `case_records`
--
ALTER TABLE `case_records`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `chat_conversations`
--
ALTER TABLE `chat_conversations`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `chat_messages`
--
ALTER TABLE `chat_messages`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `checklist_items`
--
ALTER TABLE `checklist_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `law_topics`
--
ALTER TABLE `law_topics`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `office_contacts`
--
ALTER TABLE `office_contacts`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `support_messages`
--
ALTER TABLE `support_messages`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `support_threads`
--
ALTER TABLE `support_threads`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `case_records`
--
ALTER TABLE `case_records`
  ADD CONSTRAINT `fk_case_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `chat_conversations`
--
ALTER TABLE `chat_conversations`
  ADD CONSTRAINT `fk_chat_owner` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD CONSTRAINT `fk_chat_message_conversation` FOREIGN KEY (`conversation_id`) REFERENCES `chat_conversations` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `checklist_items`
--
ALTER TABLE `checklist_items`
  ADD CONSTRAINT `fk_checklist_owner` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `law_translations`
--
ALTER TABLE `law_translations`
  ADD CONSTRAINT `fk_law_translation_topic` FOREIGN KEY (`law_topic_id`) REFERENCES `law_topics` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `fk_notification_recipient` FOREIGN KEY (`recipient_user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `fk_notification_support` FOREIGN KEY (`support_thread_id`) REFERENCES `support_threads` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `notification_reads`
--
ALTER TABLE `notification_reads`
  ADD CONSTRAINT `fk_notification_read_notice` FOREIGN KEY (`notification_id`) REFERENCES `notifications` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_notification_read_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `support_messages`
--
ALTER TABLE `support_messages`
  ADD CONSTRAINT `fk_support_message_sender` FOREIGN KEY (`sender_user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `fk_support_message_thread` FOREIGN KEY (`thread_id`) REFERENCES `support_threads` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `support_threads`
--
ALTER TABLE `support_threads`
  ADD CONSTRAINT `fk_support_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
