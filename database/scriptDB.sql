create table users(
	id UUID,
	name varchar(255) not null,
	email varchar(255) not null,
	phone char(10),
	password varchar(255) not null,
	refresh_token varchar(255),
	status varchar(100) not null,
	created_at timestamp default current_timestamp ,
	updated_at timestamp ,
	
	constraint user_id_pk primary key (id),
	constraint email_unq unique (email),
	constraint phone_unq unique (phone),
	constraint status_type check (status in ('active','inactive','banned'))
);


create table workspace (
	id UUID,
	name varchar(255) not null,
	description varchar(255),
	status varchar(10) not null default 'active',
	created_at timestamp not null default current_timestamp,
	updated_at timestamp ,
	
	constraint workspace_id_pk primary key(id),
	constraint status_check check(status in ('active','inactive'))
);


create  table workspace_members(
	id UUID,
	role varchar(255) not null,
	status varchar(10) not null,
	joined_at timestamp not null default current_timestamp,
	created_at timestamp not null default current_timestamp,
	updated_at timestamp,
	member_id UUID,
	workspace_id UUID,
	
	constraint workspace_member_pk primary key (id),
	constraint role_check check (role in ('owner','member','master')),
	constraint status check (status in ('active','inactive','banned')),
	constraint member_fk foreign key (member_id) references users (id) ,
	constraint workspace_fk foreign key (workspace_id) references workspace (id) ,
	constraint exist_member unique(member_id,workspace_id)
);


create table task(
	id UUID,
	title varchar(255) not null,
	description varchar(255) not null,
	priority smallint not null,
	start_at timestamp not null,
	end_at timestamp not null,
	status varchar(20) not null,
	created_at timestamp not null default current_timestamp,
	updated_at timestamp,
	created_by UUID,
	workspace_id UUID,
	
	constraint task_pk primary key (id),
	constraint priority_check check (priority >= 1 and priority <= 5),
	constraint start_at_check check (start_at >= current_timestamp),
	constraint end_at_check check (end_at >= current_timestamp and end_at > start_at),
	constraint status_check check (status in ('todo', 'in_progress', 'overdue','done','rejected','in_review','review', 'bug')),
	constraint created_by_fk foreign key (created_by) references workspace_members (id) on delete set null,
	constraint workspace_id_fk foreign key (workspace_id) references workspace (id)
);

create table assign_task (
	id UUID,
	member_id UUID,
	task_id UUID,
	
	constraint assign_task_pk primary key (id),
	constraint member_assign_fk foreign key (member_id) references workspace_members (id) on delete cascade,
	constraint task_assign_fk foreign key (task_id) references task (id) on delete cascade
);


create table comments (
	id UUID,
	workspace_id UUID,
	created_by UUID,
	task_id UUID,
	content TEXT not null,
	parent_id UUID,
	created_at timestamp not null default current_timestamp,
	
	constraint comment_pk primary key (id),
	constraint workspace_fk foreign key (workspace_id) references workspace (id),
	constraint created_by_fk foreign key (created_by) references users  (id),
	constraint task_fk foreign key (task_id) references task (id) on delete cascade ,
	constraint parent_fk foreign key (parent_id) references comments (id) on delete cascade
);



create table group_chat(
	id UUID,
	name varchar(255) not null,
	workspace_id UUID,
	created_at timestamp not null default current_timestamp,
	updated_at timestamp,
	
	constraint group_pk primary key(id),
	constraint workspace_fk foreign key (workspace_id) references workspace (id) on delete cascade
);

create table group_members(
	id UUID,
	member_id UUID,
	group_id UUID not null,
	created_at timestamp not null default current_timestamp,
	
	constraint group_member_pk primary key (id),
	constraint group_fk foreign key (group_id) references group_chat (id) on delete cascade ,
	constraint member_fk foreign key (member_id) references users (id)
);


create table message(
	id UUID,
	content TEXT not null,
	created_by UUID not null,
	group_id UUID,
	created_at timestamp not null default current_timestamp,
	
	constraint message_id primary key (id), 
	constraint created_by_fk foreign key (created_by) references users (id),
	constraint group_fk foreign key (group_id) references group_chat(id) on delete cascade
);

CREATE INDEX IF NOT EXISTS idx_task_workspace_created_at
	ON task (workspace_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_joined_at
	ON workspace_members (workspace_id, joined_at);

CREATE INDEX IF NOT EXISTS idx_assign_task_task_member
	ON assign_task (task_id, member_id);

CREATE INDEX IF NOT EXISTS idx_assign_task_member_task
	ON assign_task (member_id, task_id);

CREATE INDEX IF NOT EXISTS idx_group_chat_workspace
	ON group_chat (workspace_id);

CREATE INDEX IF NOT EXISTS idx_group_members_member_group
	ON group_members (member_id, group_id);

CREATE INDEX IF NOT EXISTS idx_group_members_group_member
	ON group_members (group_id, member_id);

CREATE INDEX IF NOT EXISTS idx_message_group_created_id
	ON message (group_id, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_comments_task_workspace
	ON comments (task_id, workspace_id);

CREATE INDEX IF NOT EXISTS idx_comments_parent
	ON comments (parent_id);

CREATE INDEX IF NOT EXISTS idx_users_lower_email
	ON users (LOWER(email));
