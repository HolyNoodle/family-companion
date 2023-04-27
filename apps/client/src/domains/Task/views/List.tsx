import React, {useEffect, useRef, useState} from "react";
import {useSelector} from "react-redux";
import styled from "styled-components";

import {useAppDispatch} from "src/store";

import {fetchTasks, selectAllTasks, selectTasksStatus} from "src/domains/Task/state";
import {Button, List, Popconfirm, Space} from "antd";
import TaskForm from "src/domains/Task/components/Form";
import {Task} from "@famcomp/common";
import api from "src/api";
import {
  DeleteFilled,
  DownloadOutlined,
  EditOutlined,
  PlusOutlined,
  UploadOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";

const FeedContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  scroll-behavior: smooth;
  overflow-y: visible;
`;

const TaskList = () => {
  const feedContainerRef = useRef<HTMLDivElement>();
  const tasks = useSelector(selectAllTasks);
  const taskStatus = useSelector(selectTasksStatus);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (taskStatus === "idle") {
      dispatch(fetchTasks());
    }
  }, [taskStatus]);

  const [create, setCreate] = useState(false);
  const [edit, setEdit] = useState<Task>(undefined);
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (task: Task) => {
    setCreating(true);
    try {
      await api.pushTask(task);
      setCreate(false);
      setEdit(undefined);
      dispatch(fetchTasks());
    } finally {
      setCreating(false);
    }
  };

  return (
    <FeedContainer
      ref={(el) => {
        feedContainerRef.current = el;
      }}
    >
      <TaskForm
        submitting={creating}
        open={!!edit}
        task={edit}
        onSubmit={handleSubmit}
        onClose={() => setEdit(undefined)}
      />
      <TaskForm
        submitting={creating}
        open={create}
        onSubmit={handleSubmit}
        onClose={() => setCreate(false)}
      />
      <Space>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEdit(undefined);
            setCreate(true);
          }}
        >
          Add task
        </Button>
        <Button
          icon={<DownloadOutlined />}
          onClick={async () => {
            const tasks = await api.getTasks();

            const aElement = document.createElement("a");
            aElement.setAttribute(
              "download",
              `backup-${dayjs(new Date()).format("YYYYMMDD_HHmmss")}.json`
            );
            const href = URL.createObjectURL(new Blob([JSON.stringify(tasks)]));
            aElement.href = href;
            aElement.setAttribute("target", "_blank");
            aElement.click();
            URL.revokeObjectURL(href);
          }}
        >
          Backup
        </Button>
        <Button
          icon={<UploadOutlined />}
          onClick={async () => {
            const input: HTMLInputElement = document.createElement("input");
            input.type = "file";

            input.onchange = (e) => {
              const stream = new FileReader();
              stream.onload = async function () {
                const tasks = JSON.parse(this.result as string);

                await api.uploadBackup(tasks);
                
                dispatch(fetchTasks());
              };
              stream.readAsText((e.target as any).files[0]);
            };
            input.click();
          }}
        >
          Upload
        </Button>
      </Space>
      <List
        dataSource={tasks}
        renderItem={(item) => (
          <List.Item
            actions={[
              <Button
                icon={<EditOutlined />}
                onClick={() => {
                  setEdit(item);
                  setCreate(false);
                }}
              />,
              <Button
                danger
                icon={<DeleteFilled />}
                onClick={async () => {
                  if (confirm("Are you sure you want to delete this task?")) {
                    await api.deleteTask(item.id);
                    dispatch(fetchTasks());
                  }
                }}
              />
            ]}
          >
            {item.label}
          </List.Item>
        )}
      />
    </FeedContainer>
  );
};

export default TaskList;
