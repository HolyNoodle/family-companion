import React, {useEffect, useState} from "react";
import {Form, Input, Button, DatePicker, Modal, FormInstance} from "antd";
import {Task, WithId} from "src/types";
import dayjs from "dayjs";

export interface TaskFormProps {
  submitting: boolean;
  onSubmit: (task: Task) => void;
  onClose: () => void;
  task?: WithId<Task>;
  open?: boolean;
}

const TaskForm = ({onSubmit, onClose, submitting, task, open = false}: TaskFormProps) => {
  const [formRef, setFormRef] = useState<FormInstance<Task>>();

  useEffect(() => {
    formRef?.resetFields();
  }, [formRef, task]);
  
  return (
    <Form
      ref={setFormRef}
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
      <Modal
        open={open}
        okButtonProps={{
          htmlType: "submit",
          loading: submitting,
          disabled: submitting
        }}
        onCancel={onClose}
        onOk={formRef?.submit}
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
      </Modal>
    </Form>
  );
};

export default TaskForm;
