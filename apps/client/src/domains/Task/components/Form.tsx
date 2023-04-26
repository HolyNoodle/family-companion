import React, {useEffect, useMemo, useState} from "react";
import {Form, Input, DatePicker, Modal} from "antd";
import {Task} from "@famcomp/common";
import dayjs from "dayjs";
import {parse} from "@datasert/cronjs-parser";
import {getFutureMatches} from "@datasert/cronjs-matcher";

export interface TaskFormProps {
  submitting: boolean;
  onSubmit: (task: Task) => void;
  onClose: () => void;
  task?: Partial<Task>;
  open?: boolean;
}

const generateCronString = (date: Date): string => {
  const day = date.getUTCDate();
  const month = date.getUTCMonth() + 1;
  const hour = date.getUTCHours();
  const minute = date.getUTCMinutes();
  const year = date.getUTCFullYear();

  return `${minute} ${hour} ${day} ${month} ? ${year}`;
};

const TaskForm = ({onSubmit, onClose, submitting, task, open = false}: TaskFormProps) => {
  const [form] = Form.useForm();
  const [nextIterations, setNextIterations] = useState<Date[]>([]);

  useEffect(() => {
    form.resetFields();
    task?.startDate && handleCronChange(task.cron || generateCronString(task.startDate.toDate()));
  }, [task]);

  const handleCronChange = (cron: string) => {
    try {
      const nextIterations = getFutureMatches(cron, {
        startAt: form.getFieldValue("startDate")?.toDate().toISOString()
      }).map((d) => new Date(d));
      setNextIterations(nextIterations);
      form.setFieldValue("cron", cron);
    } catch (ex) {
      console.error(ex);
      return [];
    }
  };

  const handleLabelChange = (label: string) => {
    form.setFieldValue(
      "id",
      label
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLocaleLowerCase()
        .replaceAll(" ", "_")
    );
    form.setFieldValue("label", label);
  };

  return (
    <Form
      form={form}
      name="basic"
      labelCol={{span: 8}}
      wrapperCol={{span: 16}}
      style={{maxWidth: 600}}
      initialValues={{
        ...task,
        startDate: dayjs(task?.startDate),
        cron:
          task?.cron ||
          (task?.startDate && generateCronString(task!.startDate.toDate())) ||
          undefined
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
        onOk={form.submit}
      >
        <Form.Item
          label="Label"
          name="label"
          rules={[{required: true, message: "Please input a label for the task"}]}
        >
          <Input onChange={!task?.id ? (e) => handleLabelChange(e.target.value) : undefined} />
        </Form.Item>
        <Form.Item
          label="Id"
          name="id"
          rules={[{required: true, message: "Please input an id for the task"}]}
        >
          <Input disabled={!!task?.id} />
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
          help={
            <div>
              Next iterations:{" "}
              <ul>
                {nextIterations.map((d) => (
                  <li>{d.toLocaleString()}</li>
                ))}
              </ul>
            </div>
          }
          rules={[
            {
              validator(_, value) {
                return new Promise<void>((resolve, reject) => {
                  if (!value) {
                    resolve();
                    return;
                  }

                  try {
                    parse(value);
                    resolve();
                  } catch (ex) {
                    console.error(ex);
                    reject("INVALID_CRON");
                  }
                });
              }
            }
          ]}
        >
          <Input onChange={(e) => handleCronChange(e.target.value)} />
        </Form.Item>
      </Modal>
    </Form>
  );
};

export default TaskForm;
