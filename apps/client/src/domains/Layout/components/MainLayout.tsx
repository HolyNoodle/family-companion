import {Layout, Space} from "antd";
import React, { useContext } from "react";
import {Link, Outlet} from "react-router-dom";
import { TranslatorContext } from "src/context";
import styled from "styled-components";

const AppLayout = styled(Layout)`
  height: 100%;

  a {
    color: white;
  }
`;

const MainLayout = () => {
  const {translator} = useContext(TranslatorContext);
  return (
    <AppLayout>
      <Layout.Header>
        <Space>
          <Link to={"/"}>{translator.translations.routes.schedule}</Link>
          <Link to={"/dashboard"}>{translator.translations.routes.dashboard}</Link>
          <Link to={"/tasks"}>{translator.translations.routes.tasks}</Link>
        </Space>
      </Layout.Header>
      <Layout.Content>
        <Outlet />
      </Layout.Content>
    </AppLayout>
  );
};

export default MainLayout;
