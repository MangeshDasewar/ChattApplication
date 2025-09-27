
CREATE DATABASE IF NOT EXISTS alignbox_chat;
USE alignbox_chat;


CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    avatar_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS `groups` (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    avatar_url VARCHAR(255),
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS group_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NOT NULL,
    user_id INT NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_anonymous BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_group_user (group_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NOT NULL,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    is_anonymous BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO users (username, email, avatar_url) VALUES 
('yash_sharma', 'yash@example.com', '/placeholder.svg?height=40&width=40'),
('kirtidan_gadhvi', 'kirtidan@example.com', '/placeholder.svg?height=40&width=40'),
('abhay_shukla', 'abhay@example.com', '/placeholder.svg?height=40&width=40');

INSERT INTO `groups` (name, description, avatar_url, created_by) VALUES 
('Fun Friday Group', 'Weekly fun activities and discussions', '/placeholder.svg?height=40&width=40', 1);

INSERT INTO group_members (group_id, user_id, is_anonymous) VALUES 
(1, 1, FALSE),
(1, 2, FALSE),
(1, 3, FALSE);

INSERT INTO messages (group_id, user_id, content, is_anonymous) VALUES 
(1, 1, 'Someone order Bornvita!!', TRUE),
(1, 1, 'hahahahah!!', TRUE),
(1, 1, 'I\'m Excited For this Event! Ho-Ho', TRUE),
(1, 2, 'Hi Guysss 👋', FALSE),
(1, 1, 'Hello!', TRUE),
(1, 1, 'Yessss!!!!!!!', TRUE),
(1, 2, 'Maybe I am not attending this event!', FALSE),
(1, 3, 'We have Surprise For you!!', FALSE);
