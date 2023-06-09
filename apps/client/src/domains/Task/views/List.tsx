import React, {useContext} from "react";
import styled from "styled-components";

import {useAppDispatch} from "src/store";

import {fetchTasks, useTasks} from "src/domains/Task/state";
import {Button, List, Space} from "antd";
import api from "src/api";
import {
  DeleteFilled,
  DownloadOutlined,
  EditOutlined,
  PlusOutlined,
  UploadOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import {TranslatorContext} from "src/context";
import {useNavigate} from "react-router-dom";

const FeedContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  scroll-behavior: smooth;
  overflow-y: visible;
`;

const TaskList = () => {
  const {translator} = useContext(TranslatorContext);
  const tasks = useTasks();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  return (
    <FeedContainer>
      <Space>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            navigate("/tasks/create");
          }}
        >
          {translator.translations.task.actions.create}
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
          {translator.translations.task.actions.download}
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
          {translator.translations.task.actions.upload}
        </Button>
        <Button
          icon={<DownloadOutlined />}
          onClick={async () => {
            const tasks = await api.getLogs();

            const aElement = document.createElement("a");
            aElement.setAttribute(
              "download",
              `logs-${dayjs(new Date()).format("YYYYMMDD_HHmmss")}.txt`
            );
            const href = URL.createObjectURL(new Blob([tasks.join("\n")]));
            aElement.href = href;
            aElement.setAttribute("target", "_blank");
            aElement.click();
            URL.revokeObjectURL(href);
          }}
        >
          {translator.translations.task.actions.logs}
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
                  navigate("/tasks/" + item.id);
                }}
              />,
              <Button
                danger
                icon={<DeleteFilled />}
                onClick={async () => {
                  if (confirm(translator.translations.task.actions.confirmDelete)) {
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
