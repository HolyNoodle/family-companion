import React from "react";
import {Form, Input, Button} from "antd";
import {Task} from "src/types";

export interface TaskFormProps {
  submitting: boolean;
  onSubmit: (task: Task) => void;
}

const TaskForm = ({onSubmit, submitting}: TaskFormProps) => {
  return (
    <Form
      name="basic"
      labelCol={{span: 8}}
      wrapperCol={{span: 16}}
      style={{maxWidth: 600}}
      initialValues={{cron: "0 */30 * * * *"}}
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
          Create
        </Button>
      </Form.Item>
    </Form>
  );
};

export default TaskForm;
