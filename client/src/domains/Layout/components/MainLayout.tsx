import {Layout, Menu} from "antd";
import React from "react";
import styled from "styled-components";

const AppLayout = styled(Layout)`
  height: 100%;
`;

const MainLayout = ({children}: {children: any}) => {
  return (
    <AppLayout>
      <Layout.Header>
        <Menu
          theme="dark"
          mode="horizontal"
          defaultSelectedKeys={["Week"]}
          items={[{key: "Week", label: "Week"}]}
        />
      </Layout.Header>
      <Layout.Content>{children}</Layout.Content>
    </AppLayout>
  );
};

export default MainLayout;
