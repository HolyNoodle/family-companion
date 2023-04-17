import React from "react";
import {Form, Input, Button, DatePicker} from "antd";
import {Task, WithId} from "src/types";
import dayjs from "dayjs";

export interface TaskFormProps {
  submitting: boolean;
  onSubmit: (task: Task) => void;
  task?: WithId<Task>;
}

const TaskForm = ({onSubmit, submitting, task}: TaskFormProps) => {
  return (
    <Form
      name="basic"
      labelCol={{span: 8}}
      wrapperCol={{span: 16}}
      style={{maxWidth: 600}}
      initialValues={{
        startDate: dayjs(task?.startDate || new Date()),
        label: task?.label,
        description: task?.description,
        cron: task?.cron || "0 */30 * * * *"
      }}
      onFinish={onSubmit}
      autoComplete="off"
    >
      <Form.Item
        label="Label"
        name="label"
        rules={[{required: true, message: "Please input a label for the task"}]}
      >
        <Input />
      </Form.Item>

      <Form.Item label="Date" name="startDate">
        <DatePicker showTime={{format: "HH:mm"}} />
      </Form.Item>

      <Form.Item label="Description" name="description">
        <Input.TextArea />
      </Form.Item>

      <Form.Item
        label="Cron string"
        name="cron"
        rules={[{required: true, message: "Please input a cron string"}]}
      >
        <Input />
      </Form.Item>

      <Form.Item wrapperCol={{offset: 8, span: 16}}>
        <Button type="primary" htmlType="submit" loading={submitting} disabled={submitting}>
          {task?.id ? "Edit" : "Create"}
        </Button>
      </Form.Item>
    </Form>
  );
};

export default TaskForm;
